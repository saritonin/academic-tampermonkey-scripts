// ==UserScript==
// @name         Export JSTOR search results
// @namespace    https://saritonin.github.io
// @version      2024-11-05
// @description  Provides button to make exporting JSTOR search results easier
// @author       Sarah Lauser
// @match        https://www.jstor.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jstor.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const mouseClickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
    });

    // Function to check all checkboxes
    function checkAllCheckboxes() {

        const citationCheckboxes = document.querySelectorAll('div.citation > search-results-vue-pharos-checkbox');
        citationCheckboxes.forEach(checkbox => {
            const boxToClick = checkbox.shadowRoot.querySelector('.box');

            // Create a click event and dispatch it to trigger any associated onClick handlers
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });

            boxToClick.dispatchEvent(mouseClickEvent);
        });

        console.log("All checkboxes I could find have been checked.");
    }

    function exportToRIS() {

        const citeButton = document.querySelector("#bulk-cite-button");
        citeButton.dispatchEvent(mouseClickEvent);

        const citeDropdown = document.querySelector("#bulk-citation-dropdown");
        const risButton = citeDropdown.querySelector("mfe-bulk-cite-pharos-dropdown-menu-item:nth-child(4)");
        risButton.dispatchEvent(mouseClickEvent);

    }

    function getNextPage() {
        const pagination = document.querySelector("search-results-vue-pharos-pagination");
        const nextPageLink = pagination.shadowRoot.querySelector("pharos-link.next");
        nextPageLink.dispatchEvent(mouseClickEvent);
    }

    // Function to create and add the button
    function createCheckAllButton() {
        // Create a button element
        let button1 = document.createElement('button');
        button1.innerText = 'Check all search result boxes';
        button1.style.position = 'fixed';
        button1.style.top = '10px';
        button1.style.left = '10px';
        button1.style.zIndex = '9999';
        button1.style.padding = '10px 20px';
        button1.style.fontSize = '14px';
        button1.style.backgroundColor = '#4CAF50';
        button1.style.color = 'white';
        button1.style.border = 'none';
        button1.style.borderRadius = '5px';
        button1.style.cursor = 'pointer';

        // Add event listener for the button click
        button1.addEventListener('click', function() {
            checkAllCheckboxes();
        });

        // Append the button to the body of the document
        document.body.appendChild(button1);
    }
    // Function to create and add the button
    function createExportButton() {
        // Create a button element
        let button2 = document.createElement('button');
        button2.innerText = 'Export';
        button2.style.position = 'fixed';
        button2.style.top = '10px';
        button2.style.left = '235px';
        button2.style.zIndex = '9999';
        button2.style.padding = '10px 20px';
        button2.style.fontSize = '14px';
        button2.style.backgroundColor = '#4CAF50';
        button2.style.color = 'white';
        button2.style.border = 'none';
        button2.style.borderRadius = '5px';
        button2.style.cursor = 'pointer';

        // Add event listener for the button click
        button2.addEventListener('click', function() {
            exportToRIS();
        });

        // Append the button to the body of the document
        document.body.appendChild(button2);
    }
    // Function to create and add the button
    function createNextButton() {
        // Create a button element
        let button3 = document.createElement('button');
        button3.innerText = 'Next';
        button3.style.position = 'fixed';
        button3.style.top = '10px';
        button3.style.left = '325px';
        button3.style.zIndex = '9999';
        button3.style.padding = '10px 20px';
        button3.style.fontSize = '14px';
        button3.style.backgroundColor = '#4CAF50';
        button3.style.color = 'white';
        button3.style.border = 'none';
        button3.style.borderRadius = '5px';
        button3.style.cursor = 'pointer';

        // Add event listener for the button click
        button3.addEventListener('click', function() {
            getNextPage();
        });

        // Append the button to the body of the document
        document.body.appendChild(button3);
    }

    // Wait for the page to load
    window.addEventListener('load', function() {
        createCheckAllButton(); // Create and add the button to the page
        createExportButton();
        createNextButton();
    });

})();