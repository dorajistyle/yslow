/**
 * Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*global YSLOW*/
/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */

/**
 * A class that collects all in-product text.
 * @namespace YSLOW
 * @class doc
 * @static
 */
YSLOW.doc = {

    tools_desc: undefined,

    view_names: {},

    splash: {},

    rules: {},

    tools: {},

    components_legend: {},

    addRuleInfo: function (id, name, info) {
        if (typeof id === "string" && typeof name === "string" && typeof info === "string") {
            this.rules[id] = {
                'name': name,
                'info': info
            };
        }
    },

    addToolInfo: function (id, name, info) {
        if (typeof id === "string" && typeof name === "string" && typeof info === "string") {
            this.tools[id] = {
                'name': name,
                'info': info
            };
        }
    }

};

//
// Rules text
//
YSLOW.doc.addRuleInfo('ynumreq', 'Make fewer HTTP requests', 'Decreasing the number of components on a page reduces the number of HTTP requests required to render the page, resulting in faster page loads.  Some ways to reduce the number of components include:  combine files, combine multiple scripts into one script, combine multiple CSS files into one style sheet, and use CSS Sprites and image maps.');

YSLOW.doc.addRuleInfo('ycdn', 'Use a Content Delivery Network (CDN)', 'User proximity to web servers impacts response times.  Deploying content across multiple geographically dispersed servers helps users perceive that pages are loading faster.');

YSLOW.doc.addRuleInfo('yexpires', 'Add Expires headers', 'Web pages are becoming increasingly complex with more scripts, style sheets, images, and Flash on them.  A first-time visit to a page may require several HTTP requests to load all the components.  By using Expires headers these components become cacheable, which avoids unnecessary HTTP requests on subsequent page views.  Expires headers are most often associated with images, but they can and should be used on all page components including scripts, style sheets, and Flash.');

YSLOW.doc.addRuleInfo('ycompress', 'Compress components with gzip', 'Compression reduces response times by reducing the size of the HTTP response.  Gzip is the most popular and effective compression method currently available and generally reduces the response size by about 70%.  Approximately 90% of today\'s Internet traffic travels through browsers that claim to support gzip.');

YSLOW.doc.addRuleInfo('ycsstop', 'Put CSS at top', 'Moving style sheets to the document HEAD element helps pages appear to load quicker since this allows pages to render progressively.');

YSLOW.doc.addRuleInfo('yjsbottom', 'Put JavaScript at bottom', 'JavaScript scripts block parallel downloads; that is, when a script is downloading, the browser will not start any other downloads.  To help the page load faster, move scripts to the bottom of the page if they are deferrable.');

YSLOW.doc.addRuleInfo('yexpressions', 'Avoid CSS expressions', 'CSS expressions (supported in IE beginning with Version 5) are a powerful, and dangerous, way to dynamically set CSS properties.  These expressions are evaluated frequently:  when the page is rendered and resized, when the page is scrolled, and even when the user moves the mouse over the page.  These frequent evaluations degrade the user experience.');

YSLOW.doc.addRuleInfo('yexternal', 'Make JavaScript and CSS external', 'Using external JavaScript and CSS files generally produces faster pages because the files are cached by the browser.  JavaScript and CSS that are inlined in HTML documents get downloaded each time the HTML document is requested.  This reduces the number of HTTP requests but increases the HTML document size.  On the other hand, if the JavaScript and CSS are in external files cached by the browser, the HTML document size is reduced without increasing the number of HTTP requests.');

YSLOW.doc.addRuleInfo('ydns', 'Reduce DNS lookups', 'The Domain Name System (DNS) maps hostnames to IP addresses, just like phonebooks map people\'s names to their phone numbers.  When you type URL www.yahoo.com into the browser, the browser contacts a DNS resolver that returns the server\'s IP address.  DNS has a cost; typically it takes 20 to 120 milliseconds for it to look up the IP address for a hostname.  The browser cannot download anything from the host until the lookup completes.');

YSLOW.doc.addRuleInfo('yminify', 'Minify JavaScript and CSS', 'Minification removes unnecessary characters from a file to reduce its size, thereby improving load times.  When a file is minified, comments and unneeded white space characters (space, newline, and tab) are removed.  This improves response time since the size of the download files is reduced.');

YSLOW.doc.addRuleInfo('yredirects', 'Avoid URL redirects', 'URL redirects are made using HTTP status codes 301 and 302.  They tell the browser to go to another location.  Inserting a redirect between the user and the final HTML document delays everything on the page since nothing on the page can be rendered and no components can be downloaded until the HTML document arrives.');

YSLOW.doc.addRuleInfo('ydupes', 'Remove duplicate JavaScript and CSS', 'Duplicate JavaScript and CSS files hurt performance by creating unnecessary HTTP requests (IE only) and wasted JavaScript execution (IE and Firefox).  In IE, if an external script is included twice and is not cacheable, it generates two HTTP requests during page loading.  Even if the script is cacheable, extra HTTP requests occur when the user reloads the page.  In both IE and Firefox, duplicate JavaScript scripts cause wasted time evaluating the same scripts more than once.  This redundant script execution happens regardless of whether the script is cacheable.');

YSLOW.doc.addRuleInfo('yetags', 'Configure entity tags (ETags)', 'Entity tags (ETags) are a mechanism web servers and the browser use to determine whether a component in the browser\'s cache matches one on the origin server.  Since ETags are typically constructed using attributes that make them unique to a specific server hosting a site, the tags will not match when a browser gets the original component from one server and later tries to validate that component on a different server.');

YSLOW.doc.addRuleInfo('yxhr', 'Make AJAX cacheable', 'One of AJAX\'s benefits is it provides instantaneous feedback to the user because it requests information asynchronously from the backend web server.  However, using AJAX does not guarantee the user will not wait for the asynchronous JavaScript and XML responses to return.  Optimizing AJAX responses is important to improve performance, and making the responses cacheable is the best way to optimize them.');

YSLOW.doc.addRuleInfo('yxhrmethod', 'Use GET for AJAX requests', 'When using the XMLHttpRequest object, the browser implements POST in two steps:  (1) send the headers, and (2) send the data.  It is better to use GET instead of POST since GET sends the headers and the data together (unless there are many cookies).  IE\'s maximum URL length is 2 KB, so if you are sending more than this amount of data you may not be able to use GET.');

YSLOW.doc.addRuleInfo('ymindom', 'Reduce the number of DOM elements', 'A complex page means more bytes to download, and it also means slower DOM access in JavaScript.  Reduce the number of DOM elements on the page to improve performance.');

YSLOW.doc.addRuleInfo('yno404', 'Avoid HTTP 404 (Not Found) error', 'Making an HTTP request and receiving a 404 (Not Found) error is expensive and degrades the user experience.  Some sites have helpful 404 messages (for example, "Did you mean ...?"), which may assist the user, but server resources are still wasted.');

YSLOW.doc.addRuleInfo('ymincookie', 'Reduce cookie size', 'HTTP cookies are used for authentication, personalization, and other purposes.  Cookie information is exchanged in the HTTP headers between web servers and the browser, so keeping the cookie size small minimizes the impact on response time.');

YSLOW.doc.addRuleInfo('ycookiefree', 'Use cookie-free domains', 'When the browser requests a static image and sends cookies with the request, the server ignores the cookies.  These cookies are unnecessary network traffic.  To workaround this problem, make sure that static components are requested with cookie-free requests by creating a subdomain and hosting them there.');

YSLOW.doc.addRuleInfo('ynofilter', 'Avoid AlphaImageLoader filter', 'The IE-proprietary AlphaImageLoader filter attempts to fix a problem with semi-transparent true color PNG files in IE versions less than Version 7.  However, this filter blocks rendering and freezes the browser while the image is being downloaded.  Additionally, it increases memory consumption.  The problem is further multiplied because it is applied per element, not per image.');

YSLOW.doc.addRuleInfo('yimgnoscale', 'Do not scale images in HTML', 'Web page designers sometimes set image dimensions by using the width and height attributes of the HTML image element.  Avoid doing this since it can result in images being larger than needed.  For example, if your page requires image myimg.jpg which has dimensions 240x720 but displays it with dimensions 120x360 using the width and height attributes, then the browser will download an image that is larger than necessary.');

YSLOW.doc.addRuleInfo('yfavicon', 'Make favicon small and cacheable', 'A favicon is an icon associated with a web page; this icon resides in the favicon.ico file in the server\'s root.  Since the browser requests this file, it needs to be present; if it is missing, the browser returns a 404 error (see "Avoid HTTP 404 (Not Found) error" above).  Since favicon.ico resides in the server\'s root, each time the browser requests this file, the cookies for the server\'s root are sent.  Making the favicon small and reducing the cookie size for the server\'s root cookies improves performance for retrieving the favicon.  Making favicon.ico cacheable avoids frequent requests for it.');

YSLOW.doc.addRuleInfo('yemptysrc', 'Avoid empty src or href', 'You may expect a browser to do nothing when it encounters an empty image src.  However, it is not the case in most browsers. IE makes a request to the directory in which the page is located; Safari, Chrome, Firefox 3 and earlier make a request to the actual page itself. This behavior could possibly corrupt user data, waste server computing cycles generating a page that will never be viewed, and in the worst case, cripple your servers by sending a large amount of unexpected traffic.');

YSLOW.doc.addRuleInfo('thirdpartyasyncjs','Load third party javascript asynchronously','Always load third party javascript asynchronously. Third parties that will be checked are twitter, facebook, google (api, analythics, ajax), linkedin, disqus, pinterest & jquery.');
YSLOW.doc.addRuleInfo('cssprint','Avoid loading specific css for print','Loading a specific stylesheet for print, can block rendering in your browser (depending on browser version) and will for almost all browsers, block the onload event to fire (even though the print stylesheet is not even used!).');
YSLOW.doc.addRuleInfo('cssinheaddomain','Load CSS in head from document domain','CSS files inside of HEAD should be loaded from the same domain as the main document, in order to avoid DNS lookups, because you want to have the HEAD part of the page finished as fast as possible, for the browser to be abe to start render the page. This is extra important for mobile.');
YSLOW.doc.addRuleInfo('syncjsinhead','Never load JS synchronously in head','Javascript files should never be loaded synchronously in HEAD, because it will block the rendering of the page.');
YSLOW.doc.addRuleInfo('avoidfont','Avoid use of web fonts','Avoid use of webfonts because they will decrease the performance of the page.');
YSLOW.doc.addRuleInfo('totalrequests','Reduce number of total requests','Avoid to have too many requests on your page. The more requests, the slower the page will be for the end user.');
YSLOW.doc.addRuleInfo('expiresmod','Have expire headers for static components','By adding HTTP expires headers to your static files, the files will be cached in the end users browser.');
YSLOW.doc.addRuleInfo('spof','Frontend single point of failure',' A page can be stopped to be loaded in the browser, if a single script, css and in some cases a font couldn\'t be fetched or loading slow (the white screen of death), and that is something you really want to avoid. Never load 3rd party components inside of head!  One important note, right now this rule treats domain and subdomains as ok, that match the document domain, all other domains is treated as a SPOF. The score is calculated like this: Synchronously loaded javascripts inside of head, hurts you the most, then CSS files inside of head hurts a little less, font face inside of css files further less, and least inline font face files. One rule SPOF rule missing is the IE specific feature, that a font face will be SPOF if a script is requested before the font face file.');
YSLOW.doc.addRuleInfo('nodnslookupswhenfewrequests','Avoid DNS lookups when a page has few requests','If you have few requests on a page, they should all be on the same domain to avoid DNS lookups, because the lookups will cost much.');
YSLOW.doc.addRuleInfo('inlinecsswhenfewrequest','Do not load css files when the page has few request','When a page has few requests (or actually maybe always if you dont have a massive amount of css), it is better to inline the css, to make the page to start render as early as possible.');
YSLOW.doc.addRuleInfo('criticalpath', 'Avoid slowing down the critical rendering path','Every request fetched inside of HEAD, will postpone the rendering of the page! Do not load javascript synchronously inside of head, load files from the same domain as the main document (to avoid DNS lookups) and inline CSS for a really fast rendering path. The scoring system for this rule, will give you minus score for synchronously loaded javascript inside of head, css files requested inside of head and minus score for every DNS lookup inside of head.');
YSLOW.doc.addRuleInfo('textcontent','Have a reasonable percentage of textual content compared to the rest of the page','Make sure the amount of HTML elements are too many compared to text content.');
YSLOW.doc.addRuleInfo('noduplicates', 'Remove duplicate JavaScript and CSS', 'Duplicate JavaScript and CSS files hurt performance by creating unnecessary HTTP requests (IE only) and wasted JavaScript execution (IE and Firefox).  In IE, if an external script is included twice and is not cacheable, it generates two HTTP requests during page loading.  Even if the script is cacheable, extra HTTP requests occur when the user reloads the page.  In both IE and Firefox, duplicate JavaScript scripts cause wasted time evaluating the same scripts more than once.  This redundant script execution happens regardless of whether the script is cacheable.');
YSLOW.doc.addRuleInfo('cssnumreq','Make fewer HTTP requests for CSS files','Decreasing the number of components on a page reduces the number of HTTP requests required to render the page, resulting in faster page loads. Combine your CSS files into as few as possible.');
YSLOW.doc.addRuleInfo('cssimagesnumreq','Make fewer HTTP requests for CSS image files','Decreasing the number of components on a page reduces the number of HTTP requests required to render the page, resulting in faster page loads. Combine your CSS images files into as few CSS sprites as possible.');
YSLOW.doc.addRuleInfo('jsnumreq','Make fewer synchronously HTTP requests for Javascript files','Decreasing the number of components on a page reduces the number of HTTP requests required to render the page, resulting in faster page loads. Combine your Javascript files into as few as possible (and load them asynchronously).');
YSLOW.doc.addRuleInfo('longexpirehead','Have Expires headers equals or longer than one year','Having really long cache headers are beneficial for caching.');

//
// Tools text
//
YSLOW.doc.tools_desc = 'Click on the tool name to launch the tool.';

YSLOW.doc.addToolInfo('jslint', 'JSLint', 'Run JSLint on all JavaScript code in this document');

YSLOW.doc.addToolInfo('alljs', 'All JS', 'Show all JavaScript code in this document');

YSLOW.doc.addToolInfo('jsbeautified', 'All JS Beautified', 'Show all JavaScript code in this document in an easy to read format');

YSLOW.doc.addToolInfo('jsminified', 'All JS Minified', 'Show all JavaScript code in this document in a minified (no comments or white space) format');

YSLOW.doc.addToolInfo('allcss', 'All CSS', 'Show all CSS code in this document');

YSLOW.doc.addToolInfo('cssmin', 'YUI CSS Compressor', 'Show all CSS code in the document in a minified format');

YSLOW.doc.addToolInfo('smushItAll', 'All Smush.it&trade;', 'Run Smush.it&trade; on all image components in this document');

YSLOW.doc.addToolInfo('printableview', 'Printable View', 'Show a printable view of grades, component lists, and statistics');

//
// Splash text
//
YSLOW.doc.splash.title = 'Grade your web pages with YSlow';

YSLOW.doc.splash.content = {
    'header': 'YSlow gives you:',
    'text': '<ul><li>Grade based on the performance of the page (you can define your own ruleset)</li><li>Summary of the page components</li><li>Chart with statistics</li><li>Tools for analyzing performance, including Smush.it&trade; and JSLint</li></ul>'
};

YSLOW.doc.splash.more_info = 'Learn more about YSlow and the Yahoo! Developer Network';

//
// Rule Settings
//
YSLOW.doc.rulesettings_desc = 'Choose which ruleset (Sitespeed, YSlow V2, Classic V1, or Small Site/Blog) best fits your specific needs.  Or create a new set and click Save as... to save it.';

//
// Components table legend
//
YSLOW.doc.components_legend.beacon = 'type column indicates the component is loaded after window onload event';
YSLOW.doc.components_legend.after_onload = 'denotes 1x1 pixels image that may be image beacon';

//
// View names
//
YSLOW.doc.view_names = {
    grade: 'Grade',
    components: 'Components',
    stats: 'Statistics',
    tools: 'Tools',
    rulesetedit: 'Rule Settings'
};

// copyright text
YSLOW.doc.copyright = 'Copyright &copy; ' + (new Date()).getFullYear() + ' Yahoo! Inc. All rights reserved.';
