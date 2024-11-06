// ==UserScript==
// @name         Export DOAJ search results
// @namespace    https://saritonin.github.io
// @version      2024-11-06
// @description  Exports .RIS-formatted citations for search results to a .txt file (.ris needs Tampermonkey options modifications)
// @author       Sarah Lauser
// @match        https://doaj.org/search/articles*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=doaj.org
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';
    // Note: This was coded with liberal assistance from ChatGPT. I've tested it, but the code has not been fully checked for saneness/efficiency.

    // Function to extract citation information from an individual article
    function extractCitationData(article) {
        const citation = {};

        // Extracting the article title
        const titleElement = article.querySelector('h3.search-results__heading a');
        citation.title = titleElement ? titleElement.textContent.trim() : 'Untitled Article';

        // Extracting the authors
        const authorsArray = article.querySelector('.search-results__main ul.inlined-list');
        const authorsElement = authorsArray.querySelectorAll('li');
        citation.authors = Array.from(authorsElement).map(author => author.textContent.trim().replace(/,$/, '')) || ['Unknown Author'];

        // Extracting the journal title and year
        const journalElement = article.querySelector('p.label a');
        if (journalElement) {
            citation.journal = journalElement.textContent.trim();
            // Remove content in parentheses from the journal title
            citation.journal = citation.journal.replace(/\s?\(.*\)/, '').trim();
            // Parse out the year from the same element
            citation.year = journalElement.textContent.trim().replace(/.*\s?\(.*(\d{4})\).*/, '$1') || 'Unknown Year';
        } else {
            citation.journal = 'Unknown Journal';
        }

        // Extracting the publisher from the "Published by" text
        const publisherElement = Array.from(article.querySelectorAll('li')).find(li => li.textContent.includes('Published by'));
        citation.publisher = publisherElement ? publisherElement.querySelector('em')?.textContent.trim() : 'Unknown Publisher';

        // Extracting the abstract text
        const abstractElement = article.querySelector('.doaj-public-search-abstracttext');
        citation.abstract = abstractElement ? abstractElement.textContent.trim() : 'No abstract available';

        // Extracting the keywords
        const keywordsElement = article.querySelector('.search-results__body ul.inlined-list');
        //citation.keywords = keywordsElement ? Array.from(keywordsElement.querySelectorAll('li')).map(keyword => keyword.textContent.trim()) : [];
        citation.keywords = keywordsElement ? Array.from(keywordsElement.querySelectorAll('li')).map(keyword => keyword.textContent.trim().replace(/,$/, '')) : [];

        return citation;
    }

    // Function to generate the RIS format for an individual article
    function generateRIS(citation) {
        // Generate the RIS data with separate AU lines for each author
        let risData = `TY  - JOUR\n`;
        citation.authors.forEach(author => {
            risData += `AU  - ${author}\n`;
        });
        risData += `TI  - ${citation.title}\n`;
        risData += `JO  - ${citation.journal}\n`;
        risData += `PY  - ${citation.year}\n`;
        risData += `PB  - ${citation.publisher}\n`;
        risData += `AB  - ${citation.abstract}\n`;
        if (citation.keywords.length > 0) {
            citation.keywords.forEach(keyword => {
                risData += `KW  - ${keyword}\n`;
            });
        }
        risData += `ER  - \n`; // End of record
        return risData;
    }

    // Function to trigger download of the RIS file containing all citations
    function downloadAllRIS(allRisData) {
        console.log(allRisData); // Log the RIS data (for debugging)

        // Get the current date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed, so add 1
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');

        // Format the date as YYYYMMDD_HHMM
        const formattedDate = `${year}${month}${day}_${hour}${minute}`;

        // Build the filename with the date suffix
        // We have to save it as a .txt file because saving it as a .ris file would require users to modify their Tampermonkey whitelist
        const filename = `doaj_citations_ris_${formattedDate}.txt`;

        const blob = new Blob([allRisData], {
            type: 'application/x-rtf'
        });

        GM_download({
            url: URL.createObjectURL(blob),
            name: filename,
            saveAs: true
        });
    }

    // Function
    function exportAllArticles() {
        // Select all <article> elements inside <ol>
        const articles = document.querySelectorAll('ol > li > article');

        // Start with an empty string to collect all RIS data
        let allRisData = '';

        // Loop through each article, extract its citation, and append to allRisData
        articles.forEach(article => {
            const citation = extractCitationData(article);
            const risData = generateRIS(citation);
            allRisData += risData; // Append each article's RIS data to the final string
        });

        // Download the combined RIS data as a single file
        downloadAllRIS(allRisData);
    }

    // Function to create the "Export All to .RIS" button
    function makeExportButton() {
        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export All to .RIS';
        exportButton.style.padding = '10px';
        exportButton.style.zIndex = 9999;

        // Find the #top-pager element to insert the button before it
        const topPagerElement = document.getElementById('top-pager');
        if (topPagerElement) {
            // Insert the button before #top-pager
            topPagerElement.parentNode.insertBefore(exportButton, topPagerElement);
        } else {
            // If #top-pager is not found, append the button to the body (fallback)
            document.body.appendChild(exportButton);
        }

        // Event listener to handle button click and export citations
        exportButton.addEventListener('click', function() {
            exportAllArticles();
        });
    }

    // Wait for the page to finish loading before creating the button
    window.addEventListener('load', () => {
        makeExportButton();
    });
})();

