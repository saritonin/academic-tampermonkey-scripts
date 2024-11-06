// ==UserScript==
// @name         Differentiate Brightspace (D2L) class sections
// @namespace    https://saritonin.github.io
// @version      2024-09-01
// @description  Adds a colorful header text banner to help differentiate class sections with similar names
// @author       Sarah Lauser
// @match        https://brightspace.albany.edu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=albany.edu
// @grant        none
// ==/UserScript==

// USAGE NOTES
// 1) Replace @match and @icon with appropriate values for your institution.
// 2) Update the sections array with appropriate values.
//    The sectionId is the last part of the Brightspace URL for the class's homepage.

(function() {
    'use strict';

    var extraTimeout = 200;

    // Define an array of objects with section IDs, banner text, and banner color
    var sections = [
        { sectionId: '1094493', text: 'Friday', color: 'rgba(238, 178, 17, 0.5)' }, // #eeb211 but using rgba color for translucency
        { sectionId: '1094495', text: 'Monday', color: 'rgba(70, 22, 107, 0.5)' }, //   #46166b
        { sectionId: '1373408', text: 'Prof. Memic', color: 'rgba(70, 22, 107, 0.5)' },
        { sectionId: '1373410', text: 'Prof. Lauser', color: 'rgba(238, 178, 17, 0.5)' }
        // Add more objects as needed
    ];

    function createBanner(bannerText, bannerColor) {
        var newBanner = document.createElement('h1');
        newBanner.textContent = bannerText;
        newBanner.style.backgroundColor = bannerColor; // use rgba() format if you want opacity in the banner color
        return newBanner
    } // function createBanner

    // ---------------------------------------
    // MAIN PROCESSING
    // ---------------------------------------
    // check what page we are on
    var currentLocation = window.location.href;
    var onHomePage = false;
    var onSectionPage = false;
    var currentSectionId = '0';
    var currentText = '0';
    var currentColor = '0';

    if (currentLocation.endsWith("/d2l/home")) {
        //Brightspace homepage
        onHomePage = true;
        console.log("HomePage recognized");
    } else {
        //See if we are on a page for one of the sections we care about
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            if (currentLocation.indexOf(section.sectionId) > 1) {
                onSectionPage = true;
                console.log("SectionPage recognized");
                currentSectionId = section.sectionId;
                currentText = section.text;
                currentColor = section.color;
            }
        } // section loop
    } //page checker

    if (onSectionPage) {
        console.log("Adding section banner");
        window.addEventListener('load', function() {
            var banner = createBanner(currentText, currentColor);
            console.log("banner=:",banner);
            var targetElement = document.querySelector("div.d2l-navigation-s-header-logo-area > div");
            console.log("targetElement:", targetElement);

            // Check if the target element exists before appending
            if (targetElement) {
                // Append the header element to the selected element
                targetElement.appendChild(banner);
            } else {
                console.warn("Target element not found");
            }
        }); // window listener
    } else if (onHomePage) {
        console.log("Adding homepage banners");
        window.addEventListener('load', function() {
            console.log("I think the window's done loading");
            for (var i = 0; i < sections.length; i++) {
                var section = sections[i];
                if (currentLocation.indexOf(section.sectionId) > 1) {
                    // TODO: figure out how to get homepage banners to work
                    console.log("Looking for link:",'a[href="/d2l/home/' + encodeURIComponent(section.sectionId) + '"]');
                }
            } // section loop
        }); // window listener
    }

    // trying to figure out how to get the homepage banners to work
    /*

document.querySelector("d2l-my-courses").shadowRoot.querySelector("d2l-my-courses-container").shadowRoot.querySelector("div.spinner-container")
document.querySelector("d2l-my-courses").shadowRoot.querySelector("d2l-my-courses-container").shadowRoot.querySelector("d2l-tab-panel > d2l-my-courses-content").shadowRoot.querySelector("d2l-my-courses-card-grid")
document.querySelector("d2l-my-courses").shadowRoot.querySelector("d2l-my-courses-container").shadowRoot.querySelector("d2l-tab-panel > d2l-my-courses-content").shadowRoot.querySelector("d2l-my-courses-card-grid").shadowRoot.querySelector("div")
document.querySelector("d2l-my-courses").shadowRoot.querySelector("d2l-my-courses-container").shadowRoot.querySelector("d2l-tab-panel > d2l-my-courses-content").shadowRoot.querySelector("d2l-my-courses-card-grid").shadowRoot.querySelector("div > d2l-enrollment-card:nth-child(1)").shadowRoot.querySelector("d2l-card").shadowRoot.querySelector("div > a")


    /* DEPRECATED FUNCTIONS
    function addBannerToHeader(bannerText, bannerColor) {
        console.log("Creating the new banner...");

        var newBanner = document.createElement('h1');
        newBanner.textContent = bannerText;
        newBanner.style.backgroundColor = bannerColor; // use rgba() format if you want opacity in the banner color

        var targetElement = document.querySelector("div.d2l-navigation-s-header-logo-area > div");
        console.log("targetElement:", targetElement);

        // Check if the target element exists before appending
        if (targetElement) {
            // Append the header element to the selected element
            targetElement.appendChild(newBanner);
        } else {
            console.error("Target element not found");
        }
    } // function addBannerToHeader

    function addBannerToLink(sectionId, bannerText, bannerColor) {
        // Create a new banner
        var newBanner = document.createElement('h1');
        newBanner.textContent = bannerText;
        newBanner.style.backgroundColor = bannerColor; // use rgba() format if you want opacity in the banner color

        var linkElement = document.querySelector('a[href="/d2l/home/' + encodeURIComponent(sectionId) + '"]');
        // Insert the banner before the span within the link
        linkElement.insertBefore(newBanner, linkElement.querySelector('.d2l-card-link-text'));
    }
    */
    /*


    window.addEventListener('DOMContentLoaded', function() {
        // need to give it a small timeout to make it work more reliably
        setTimeout(function() {
            var currentLocation = window.location.href;

            if (currentLocation.indexOf("/d2l/home") > 1) {
                // Brightspace homepage - need to wait for it to finish loading the whole page (window.onload)
                setTimeout(function() {

                    console.log("Outputting href values...");

                    // Get all div elements with the class "d2l-card-container"
                    var cardContainers = document.querySelectorAll('div.d2l-card-container');

                    // Loop through each card container
                    cardContainers.forEach(function(cardContainer) {
                        // Find the anchor elements within the card container
                        var anchorElements = cardContainer.querySelectorAll('a');

                        // Output the href values
                        anchorElements.forEach(function(anchorElement) {
                            console.log(anchorElement.href);
                        });
                    }); // cardContainer loop
                },2500); // timeout

                for (var i = 0; i < sections.length; i++) {
                    var sectionLink = sections[i];
                    console.log("Looking for link:",'a[href="/d2l/home/' + encodeURIComponent(sectionLink.sectionId) + '"]');
                    var linkElement = document.querySelector('a[href="/d2l/home/' + encodeURIComponent(sectionLink.sectionId) + '"]');
                    if (linkElement) {
                        console.log("Link element:",linkElement);
                        // Add the banner to the link
                        addBannerToLink(sectionLink.sectionId, sectionLink.text, sectionLink.color);
                    } else {
                        console.log("Link element not found");
                    } // linkElemnent found
                } // sections loop
            } else {
                // behavior for individual course pages
                // Iterate through the sections array to find a match
                for (var j = 0; j < sections.length; j++) {
                    var section = sections[j];
                    if (currentLocation.indexOf(section.sectionId) > 1) {
                        console.log("Page recognized");
                        //addBannerToHeader(section.text, section.color);
                        break; // Stop iterating after finding a match
                    } // page recognized
                } // sections loop
            } // page type differentiation
        }, extraTimeout);
    }); // window listener
    */
})();