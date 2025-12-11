// ==UserScript==
// @name         D2L Precise Attachment Anchor Click
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Wait for "Back to Assignments" nav then click the attachment anchor at the specified path (handles open shadow roots)
// @match        *://*/*d2l*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const NAV_HREF_PART = '/d2l/lms/dropbox/admin/folders_manage.d2l';
    const NAV_TEXT = 'Back to Assignments';

    // The class we expect on the div in the path
    const ATTACH_DIV_CLASS = 'd2l-submission-attachment-list-item-flexbox';

    // Click behavior: set to true to click every matching anchor, false to click only the first.
    const CLICK_ALL = false;

    /******************************
     * Utilities for deep searching (open shadowRoots)
     ******************************/
    function deepQuerySelectorAll(root, selector) {
        // Collect matches at the current root level if possible
        const results = [];
        try {
            if (root.querySelectorAll) {
                const list = root.querySelectorAll(selector);
                if (list.length) results.push(...Array.from(list));
            }
        } catch (e) {
            // ignore invalid selector errors
        }

        // Walk children, and if child has shadowRoot, recurse into it
        const walk = (node) => {
            const children = node.children || [];
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // add child itself if it matches selector (catch match errors)
                try {
                    if (child.matches && child.matches(selector)) results.push(child);
                } catch (e) { /* ignore */ }

                if (child.shadowRoot) {
                    try {
                        if (child.shadowRoot.querySelectorAll) {
                            const inner = child.shadowRoot.querySelectorAll(selector);
                            if (inner.length) results.push(...Array.from(inner));
                        }
                    } catch (e) { /* ignore */ }
                    walk(child.shadowRoot);
                }

                // recurse into light DOM children
                walk(child);
            }
        };

        walk(root);
        return Array.from(new Set(results));
    }

    // Find nodes matching a predicate by walking document + open shadowRoots.
    function deepFind(root, predicate) {
        // check root itself
        try {
            if (predicate(root)) return root;
        } catch (e) { /* ignore */ }

        const children = root.children || [];
        for (let i = 0; i < children.length; i++) {
            const c = children[i];
            try {
                if (predicate(c)) return c;
            } catch (e) { /* ignore */ }

            if (c.shadowRoot) {
                const inside = deepFind(c.shadowRoot, predicate);
                if (inside) return inside;
            }

            const deeper = deepFind(c, predicate);
            if (deeper) return deeper;
        }
        return null;
    }

    // Parent traversal that crosses shadow host boundaries:
    // for a node, parent may be parentNode, or host (if node is inside a shadowRoot)
    function getParent(node) {
        if (!node) return null;
        return node.parentNode || node.host || null;
    }

    // Finds the nearest ancestor (climbing via getParent) that satisfies predicate
    function findAncestor(node, predicate) {
        let cur = getParent(node);
        while (cur && cur !== document) {
            try {
                if (predicate(cur)) return cur;
            } catch (e) { /* ignore */ }
            cur = getParent(cur);
        }
        return null;
    }

    /******************************
     * Path-check: ensures an <a> has the required ancestor sequence
     *
     * Required sequence (closest-to-farthest):
     *   - d2l-list-item-content (ancestor of the anchor)
     *   - div with class containing ATTACH_DIV_CLASS
     *   - d2l-list-item
     *   - d2l-list
     ******************************/
    function anchorMatchesAttachmentPath(aEl) {
        if (!aEl || aEl.tagName.toLowerCase() !== 'a') return false;

        // 1) d2l-list-item-content
        const liContent = findAncestor(aEl, n => n.tagName && n.tagName.toLowerCase() === 'd2l-list-item-content');
        if (!liContent) return false;

        // 2) div.d2l-submission-attachment-list-item-flexbox (class contains)
        const attachDiv = findAncestor(liContent, n => {
            if (!n.tagName) return false;
            if (n.tagName.toLowerCase() !== 'div') return false;
            const cls = n.getAttribute && n.getAttribute('class');
            return cls && cls.indexOf(ATTACH_DIV_CLASS) !== -1;
        });
        if (!attachDiv) return false;

        // 3) d2l-list-item
        const listItem = findAncestor(attachDiv, n => n.tagName && n.tagName.toLowerCase() === 'd2l-list-item');
        if (!listItem) return false;

        // 4) d2l-list
        const listRoot = findAncestor(listItem, n => n.tagName && n.tagName.toLowerCase() === 'd2l-list');
        if (!listRoot) return false;

        // All required ancestors found in order
        return true;
    }

    /******************************
     * Nav detection (Back to Assignments)
     ******************************/
    function findBackToAssignmentsNav() {
        // Quick light-dom check: host attribute or matching element with text attribute
        const attrMatch = document.querySelector('d2l-labs-navigation-link-icon[text="' + NAV_TEXT + '"]');
        if (attrMatch) return attrMatch;

        // Search for component nodes and check their attributes or internal anchor href
        const comps = document.querySelectorAll('d2l-labs-navigation-link-icon');
        for (const c of comps) {
            if (c.getAttribute && c.getAttribute('text') === NAV_TEXT) return c;
            if (c.getAttribute && c.getAttribute('href') && c.getAttribute('href').includes(NAV_HREF_PART)) return c;
            // look inside light DOM
            const a = c.querySelector && c.querySelector('a[href*="' + NAV_HREF_PART + '"]');
            if (a) return c;
            // look inside shadowRoot if open
            if (c.shadowRoot) {
                const a2 = c.shadowRoot.querySelector && c.shadowRoot.querySelector('a[href*="' + NAV_HREF_PART + '"]');
                if (a2) return c;
                const textNode = c.shadowRoot.querySelector && c.shadowRoot.querySelector('[text="' + NAV_TEXT + '"]');
                if (textNode) return c;
            }
        }

        // Deep search for any <a> with the href fragment
        const anchor = deepFind(document, n => n.tagName && n.tagName.toLowerCase() === 'a' && n.getAttribute && n.getAttribute('href') && n.getAttribute('href').includes(NAV_HREF_PART));
        if (anchor) return anchor;

        // deepFind by node having attribute text="Back to Assignments"
        const host = deepFind(document, n => n.getAttribute && n.getAttribute('text') === NAV_TEXT);
        if (host) return host;

        return null;
    }

    /******************************
     * Main: when nav found, search for anchor(s) and click
     ******************************/
    function findAndClickAttachmentAnchors() {
        // Collect all anchors across open shadow roots
        const anchors = deepQuerySelectorAll(document, 'a');

        // Filter those that match the required path
        const matches = anchors.filter(anchorMatchesAttachmentPath);

        if (!matches.length) {
            console.log('[D2L-attach] No matching attachment anchors found yet.');
            return false;
        }

        try {
            if (CLICK_ALL) {
                matches.forEach((m, i) => {
                    try {
                        m.click();
                        console.log('[D2L-attach] clicked attachment anchor #' + (i + 1));
                    } catch (e) {
                        console.warn('[D2L-attach] click failed for match #' + (i + 1), e);
                    }
                });
            } else {
                matches[0].click();
                console.log('[D2L-attach] clicked first matching attachment anchor.');
            }
        } catch (e) {
            console.warn('[D2L-attach] click attempt error:', e);
            return false;
        }

        return true;
    }

    /******************************
     * Observers & boot
     ******************************/
    let attachmentObserver = null;
    const mainObserver = new MutationObserver((mutations, obs) => {
        const nav = findBackToAssignmentsNav();
        if (!nav) return; // keep waiting

        console.log('[D2L-attach] Detected Back-to-Assignments nav:', nav);

        // Attempt to click; if not found, set up attachmentObserver to wait for attachments
        const clicked = findAndClickAttachmentAnchors();
        if (clicked) {
            obs.disconnect();
            if (attachmentObserver) attachmentObserver.disconnect();
        } else if (!attachmentObserver) {
            attachmentObserver = new MutationObserver((muts, obs2) => {
                const ok = findAndClickAttachmentAnchors();
                if (ok) {
                    obs2.disconnect();
                    mainObserver.disconnect();
                }
            });
            attachmentObserver.observe(document.body, { childList: true, subtree: true });
        }
    });

    // Start: immediate check
    const navNow = findBackToAssignmentsNav();
    if (navNow) {
        console.log('[D2L-attach] Navigation element present on load.');
        const ok = findAndClickAttachmentAnchors();
        if (!ok) {
            attachmentObserver = new MutationObserver((m, o) => {
                const ok2 = findAndClickAttachmentAnchors();
                if (ok2) o.disconnect();
            });
            attachmentObserver.observe(document.body, { childList: true, subtree: true });
        }
    } else {
        // wait for nav to appear
        mainObserver.observe(document.body, { childList: true, subtree: true });
        // fallback periodic check
        const intervalId = setInterval(() => {
            if (findBackToAssignmentsNav()) {
                clearInterval(intervalId);
                // try immediate click, else attachment observer will handle it
                const ok2 = findAndClickAttachmentAnchors();
                if (!ok2 && !attachmentObserver) {
                    attachmentObserver = new MutationObserver((m, o) => {
                        const ok3 = findAndClickAttachmentAnchors();
                        if (ok3) o.disconnect();
                    });
                    attachmentObserver.observe(document.body, { childList: true, subtree: true });
                } else {
                    mainObserver.disconnect();
                }
            }
        }, 800);
    }

    console.log('[D2L-attach] Script initialized — awaiting page signal and attachments.');
})();
