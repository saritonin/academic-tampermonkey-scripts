// ==UserScript==
// @name         Highlight Old Date Cells
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights date cells older than one week
// @match        https://brightspace.albany.edu/d2l/lms/classlist/classlist.d2l*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function highlightOldDates() {
        const cells = document.querySelectorAll('td.d_gn.d2l-table-cell-last > label');
        const now = new Date();

        cells.forEach(label => {
            const dateText = label.textContent.trim();
            const parsedDate = new Date(dateText);

            if (!isNaN(parsedDate.getTime())) {
                const diffDays = (now - parsedDate) / (1000 * 60 * 60 * 24);

                if (diffDays > 7) {
                    // Clamp the range between 7 and 14 days
                    const clampedDays = Math.min(Math.max(diffDays, 7), 14);

                    // Compute opacity based on how old it is
                    // 7 days → 0.2 opacity (pale)
                    // 14 days → 0.7 opacity (dark)
                    const opacity = 0.2 + ((clampedDays - 7) / 7) * (0.7 - 0.2);

                    // Apply gradient red color
                    label.parentElement.style.backgroundColor = `rgba(255, 0, 0, ${opacity})`;
                    label.parentElement.title = `This date is ${Math.floor(diffDays)} days old`;
                } else {
                    // Reset if it becomes newer (optional)
                    label.parentElement.style.backgroundColor = '';
                    label.parentElement.title = '';
                }
            }
        });
    }

    // Run when the DOM is ready and whenever content changes
    const observer = new MutationObserver(() => highlightOldDates());
    observer.observe(document.body, { childList: true, subtree: true });

    highlightOldDates();
})();

