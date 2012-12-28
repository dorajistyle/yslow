/*
Rule borrowed from Stoyan Stefanov
https://github.com/stoyan/yslow
*/

var YSLOW3PO = {};
YSLOW3PO.is3p = function (url) {
  
  var patterns = [
    'ajax.googleapis.com',
    'apis.google.com',
    '.google-analytics.com',
    'connect.facebook.net',
    'platform.twitter.com',
    'code.jquery.com',
    'platform.linkedin.com',
    '.disqus.com',
    'assets.pinterest.com',
    'widgets.digg.com',
    '.addthis.com',
    'code.jquery.com',
    'ad.doubleclick.net',
    '.lognormal.com', 
    'embed.spotify.com'    
  ];
  var hostname = YSLOW.util.getHostname(url);
  var re;
  for (var i = 0; i < patterns.length; i++) {
    re = new RegExp(patterns[i]);
    if (re.test(hostname)) {
      return true;
    }
  }
  return false;
}


YSLOW.registerRule({
  id: '_3po_asyncjs',
  name: 'Load 3rd party JS asynchronously',
  info: "Use the JavaScript snippets that load the JS files asynchronously " +
        "in order to speed up the user experience.",
  category: ['js'],
  config: {},
  url: 'http://www.phpied.com/3PO#async',

  lint: function (doc, cset, config) {
    var scripts = doc.getElementsByTagName('script'), 
    comps = cset.getComponentsByType('js'),
    comp, offenders = {}, 
    offender_comps = [], 
    score = 100;
    
    // find offenders
    for (i = 0, len = scripts.length; i < len; i++) {
      comp = scripts[i];
      if (comp.src && YSLOW3PO.is3p(comp.src)) {
        if (!comp.async && !comp.defer) {
          offenders[comp.src] = 1;
        }
      }
    }

    // match offenders to YSLOW components
    for (var i = 0; i < comps.length; i++) {
      if (offenders[comps[i].url]) {
        offender_comps.push(comps[i]);
      }
    }

    // final sweep
    var message = offender_comps.length === 0 ? '' :
      'The following ' + YSLOW.util.plural('%num% 3rd party script%s%', offender_comps.length) +
        ' not loaded asynchronously:';
    score -= offender_comps.length * 21;

    return {
      score: score,
      message: message,
      components: offender_comps
    };
  }
});



YSLOW.registerRule({
  id: '_3po_jsonce',
  name: 'Load the 3rd party JS only once',
  info: 'Loading the 3rd party JS files more than once per page is not ' +
        'necessary and slows down the user experience',
  category: ['js'],
  config: {},
  url: 'http://www.phpied.com/3PO#once',
  

  lint: function (doc, cset, config) {
    var i, url, score, len,
        hash = {},
        offenders = [],
        comps = cset.getComponentsByType('js'),
        scripts = doc.getElementsByTagName('script');

    for (i = 0, len = scripts.length; i < len; i += 1) {
      url = scripts[i].src;
      if (!url || !YSLOW3PO.is3p(url) || scripts[i].async || scripts[i].defer) {
        continue;
      }
      if (typeof hash[url] === 'undefined') {
        hash[url] = 1;
      } else {
        hash[url] += 1;
      }
    }

    // match offenders to YSLOW components
    var offenders = [];
    for (var i = 0; i < comps.length; i++) {
      if (hash[comps[i].url] && hash[comps[i].url] > 1) {
        offenders.push(comps[i]);
      }
    }

    score = 100 - offenders.length * 11;

    return {
      score: score,
      message: (offenders.length > 0) ? YSLOW.util.plural(
          'There %are% %num% 3rd party JS file%s% included more than once on the page',
          offenders.length
      ) : '',
      components: offenders
    };
  }
});

/* End */


var SITESPEEDHELP = {};
  
// Borrowed from https://github.com/pmeenan/spof-o-matic/blob/master/src/background.js  
// Determining the top-level-domain for a given host is way too complex to do right
// (you need a full list of them basically)
// We are going to simplify it and assume anything that is .co.xx will have 3 parts
// and everything else will have 2

SITESPEEDHELP.getTLD =  function (host){
  var tld = host;
  var noSecondaries = /\.(gov|ac|mil|net|org|co)\.\w\w$/i;
  if (host.match(noSecondaries)) {
    var threePart = /[\w]+\.[\w]+\.[\w]+$/i;
    tld = host.match(threePart).toString();
  } else {
    var twoPart = /[\w]+\.[\w]+$/i;
    tld = host.match(twoPart).toString();
  }
  return tld;
};

SITESPEEDHELP.getSynchronouslyJavascripts =  function (js){
var syncJs = [];

for (var i = 0; i < js.length; i++) {
  if (js[i].src) {
    if (!js[i].async && !js[i].defer) {
    syncJs.push(js[i]);
    }
  }
}

return syncJs;
};

/* End */

YSLOW.registerRule({
  id: 'cssprint',
  name: 'Do not load print stylesheets, use @media type print instead',
  info: 'Loading a specific stylesheet for printing slows down the page, ' +
        'even though it is not used',
  category: ['css'],
  config: {points: 20},
  url: 'http://sitespeed.io/rules/#cssprint',
  
  lint: function (doc, cset, config) {
  var i, media, score,url,
        offenders = [],
        hash = {},
        comps = cset.getComponentsByType('css'),
        links = doc.getElementsByTagName('link');

         for (i = 0, len = links.length; i < len; i += 1) {
  
          if (links[i].media === 'print') {
            url = links[i].href;           
            hash[url] = 1;
          }
        }

     for (var i = 0; i < comps.length; i++) {
      if (hash[comps[i].url]) {
        offenders.push(comps[i]);
      }
    }
      score = 100 - offenders.length * parseInt(config.points, 20);
      
      return {
      score: score,
      message: (offenders.length > 0) ? YSLOW.util.plural(
          'There %are% %num% print css files included on the page, that should be @media query instead',
          offenders.length
      ) : '',
      components: offenders
    };


   }
});  

YSLOW.registerRule({
  id: 'cssinheaddomain',
  name: 'Load CSS in head from document domain',
  info: 'Make sure css in head is loaded from same domain as document, in order to have a better user experience and minimize dns lookups',
  category: ['css'],
  config: {points: 10},
  url: 'http://sitespeed.io/rules/#cssinheaddomain',

  lint: function (doc, cset, config) {
 
  var css = doc.getElementsByTagName('link'), 
    comps = cset.getComponentsByType('css'),
    comp, docdomain, src, offenders = {}, 
    offendercomponents = [], uniquedns = [], 
    score = 100;
  
    docdomain = YSLOW.util.getHostname(cset.doc_comp.url);

    for (i = 0, len = css.length; i < len; i++) {
      comp = css[i];
            src = comp.href || comp.getAttribute('href');
            if (src && (comp.rel === 'stylesheet' || comp.type === 'text/css')) {
               if (comp.parentNode.tagName === 'HEAD') {
                offenders[src] = 1;
               }

            }
        }

    for (var i = 0; i < comps.length; i++) {
      if (offenders[comps[i].url]) {
        if (docdomain !== YSLOW.util.getHostname(comps[i].url)) {
          offendercomponents.push(comps[i]);
        }
      }
    }

    uniquedns = YSLOW.util.getUniqueDomains(offendercomponents, true);

    var message = offendercomponents.length === 0 ? '' :
      'The following ' + YSLOW.util.plural('%num% css', offendercomponents.length) +
        ' are loaded from a different domain inside head, causing DNS lookups before page is rendered. Unique DNS in head that decreases the score:' + uniquedns.length + ".";
    // only punish dns lookups    
    score -= uniquedns.length * parseInt(config.points, 10);
  
    return {
      score: score,
      message: message,
      components: offendercomponents
    };
    }
});


/** Alternative to yjsbottom rule that doesn't seems to work right now 
with phantomjs 
*/
YSLOW.registerRule({
  id: 'syncjsinhead',
  name: 'Never load JS synchronously in head',
  info: 'Use the JavaScript snippets that load the JS files asynchronously in head ' +
        'in order to speed up the user experience.',
  category: ['js'],
  config: {points: 10},
  url: 'http://sitespeed.io/rules/#syncjsinhead',

  lint: function (doc, cset, config) {
    var scripts = doc.getElementsByTagName('script'), 
    comps = cset.getComponentsByType('js'),
    comp, offenders = {}, 
    offender_comps = [],  
    score = 100;
  
    for (i = 0, len = scripts.length; i < len; i++) {
      comp = scripts[i];
      if (comp.parentNode.tagName === 'HEAD') {
        if (comp.src) {
          if (!comp.async && !comp.defer) {
            offenders[comp.src] = 1;
          }
        }
      }
    }

    for (var i = 0; i < comps.length; i++) {
      if (offenders[comps[i].url]) {
        offender_comps.push(comps[i]);
      }
    }

    var message = offender_comps.length === 0 ? '' :
      'There are ' + YSLOW.util.plural('%num% script%s%', offender_comps.length) +
        ' that are not loaded asynchronously in head, that will block the rendering.';
    score -= offender_comps.length * parseInt(config.points, 10);
  
    return {
      score: score,
      message: message,
      components: offender_comps
    };
  }
});

YSLOW.registerRule({
  id: 'avoidfont',
  name: 'Try to avoid fonts',
  info: 'Fonts slow down the page load, try to avoid them',
  category: ['css'],
  config: {points: 10},
  url: 'http://sitespeed.io/rules/#avoidfonts',

  lint: function (doc, cset, config) {

    var comps = cset.getComponentsByType('font'),
    score;

    score = 100 - comps.length * parseInt(config.points, 10);

    var message = comps.length === 0 ? '' :
      'There are ' + YSLOW.util.plural('%num% font%s%', comps.length) +
        ' that will add extra overhead.';    

    return {
      score: score,
      message: message,
      components: comps
    };
  }
});


YSLOW.registerRule({
  id: 'criticalpath',
  name: 'Avoid slowing down the rendering critical path',
  info: 'Every file loaded inside of head, will postpone the rendering of the page, try to avoid loading javascript synchronously, load files from the same domain as the main document, and inline css for really fast critical path.',
  category: ['content'],
  config: {synchronouslyJSPoints: 10, deferJSPoints: 3, dnsLookupsPoints: 5, cssPoints: 5},
  url: 'http://sitespeed.io/rules/#criticalpath',

  lint: function (doc, cset, config) {

    var scripts = doc.getElementsByTagName('script'),
    jsComponents = cset.getComponentsByType('js'),
    cssComponents = cset.getComponentsByType('css'),
    links = doc.getElementsByTagName('link'),
    score = 100, docDomain, js, offenders = [], componentOffenders = [], comp,
    jsFail = 0, cssFail = 0, notDocumentDomains = 0, domains;

    // the domain where the document is fetched from
    // use this domain to avoid DNS lookups
    docDomain = YSLOW.util.getHostname(cset.doc_comp.url);

    // calculate the score for javascripts
    // synchronous will hurt us most
    // defer CAN hurt us and async will not 
    // all inside of head of course
    for (i = 0, len = scripts.length; i < len; i++) {
      js = scripts[i];
      if (js.parentNode.tagName === 'HEAD') {
        if (js.src) {
          if (js.async) 
            continue;
          else if (js.defer) {
            offenders[js.src] = 1;
            score -= config.deferJSPoints;
            jsFail++;
          }
          else {
            offenders[js.src] = 1;
            score -= config.synchronouslyJSPoints;
            jsFail++;
          }
        }
      }
    }

    // then for CSS
    for (i = 0, len = links.length; i < len; i++) {
      comp = links[i];
      src = comp.href || comp.getAttribute('href');
      if (src && (comp.rel === 'stylesheet' || comp.type === 'text/css')) {
               if (comp.parentNode.tagName === 'HEAD') {
                 offenders[src] = 1;
                 score -= config.cssPoints;
                 cssFail++;
               }

            }
        }

    // match them
    for (var i = 0; i < jsComponents.length; i++) {
      if (offenders[jsComponents[i].url]) {
        componentOffenders.push(jsComponents[i]);
      }
    }  

      for (var i = 0; i < cssComponents.length; i++) {
      if (offenders[cssComponents[i].url]) {
        componentOffenders.push(cssComponents[i]);
      }
    }  

    // hurt the ones that loads from another domain
    domains = YSLOW.util.getUniqueDomains(componentOffenders, true);
    for (var i = 0; i < domains.length; i++) {
      if (domains[i] !== docDomain)
        notDocumentDomains++;
    }
    score -= config.dnsLookupsPoints  * notDocumentDomains;

    message = score === 100 ? '' : 'You have ' + jsFail + ' javascripts in the critical path and ' + cssFail + ' stylesheets'  + ' using ' + notDocumentDomains  + ' extra domains';

    return {
      score: score,
      message: message,
      components:  componentOffenders
    };
  }
});

YSLOW.registerRule({
  id: 'totalrequests',
  name: 'Low number of total requests is good',
  info: 'The more number of requests, the slower the page',
  category: ['content'],
  config: {points: 5},
  url: 'http://sitespeed.io/rules/#totalrequests',

  lint: function (doc, cset, config) {


    var types = ['js', 'css', 'image', 'cssimage', 'font', 'flash', 'favicon', 'doc','iframe'];
    var comps = cset.getComponentsByType(types);
    var score = 100;

    if (comps.length < 26) {
      score = 100;
    }
    else {
      score = score + 26 - comps.length;
    }

    if (score<0) score = 0;

    var message = score === 100 ? '' :
      'The page uses ' + comps.length + 
        ' requests, that is too many to make the page load fast.';    
    var offenders = score === 100 ? '' : comps;    

    return {
      score: score,
      message: message,
      components: offenders
    };
  }
});

YSLOW.registerRule({
  id: 'spof',
  name: 'Frontend single point of failure',
  info: 'A page should not have a single point of failure a.k.a load content from a provider that can get the page to stop working.',
  category: ['misc'],
  config: {points: 10},
  url: 'http://sitespeed.io/rules/#spof',

  lint: function (doc, cset, config) {

    var css = doc.getElementsByTagName('link'), 
    scripts = doc.getElementsByTagName('script'), 
    csscomps = cset.getComponentsByType('css'),
    jscomps = cset.getComponentsByType('js'),
    docDomainTLD, src, url, matches, offenders = [], 
    nrOfInlineFontFace = 0, nrOfFontFaceCssFiles = 0, nrOfJs = 0, nrOfCss = 0,
    // RegEx pattern for retrieving all the font-face styles, borrowed from https://github.com/senthilp/spofcheck/blob/master/lib/rules.js
    pattern = /@font-face[\s\n]*{([^{}]*)}/gim, 
    urlPattern = /url\s*\(\s*['"]?([^'"]*)['"]?\s*\)/gim,
    score = 100;
  
    docDomainTld = SITESPEEDHELP.getTLD(YSLOW.util.getHostname(cset.doc_comp.url));

    // Check for css loaded in head, from another domain (not subdomain)  
    for (i = 0, len = css.length; i < len; i++) {
      csscomp = css[i];
            src = csscomp.href || csscomp.getAttribute('href');
            if (src && (csscomp.rel === 'stylesheet' || csscomp.type === 'text/css')) {
               if (csscomp.parentNode.tagName === 'HEAD') {
                 if (docDomainTLD !== SITESPEEDHELP.getTLD(YSLOW.util.getHostname(src))) {
                offenders.push(src);
                nrOfCss++;
                }
               }

            }
        }

    // Check for font-face in the external css files
    for (var i = 0; i < csscomps.length; i++) {

      matches = csscomps[i].body.match(pattern);
      if(!matches) continue;
      else {
        // we have a match, a fontface user :)
        offenders.push(csscomps[i]);
        nrOfFontFaceCssFiles++;
      }
    }

    // Check for inline font-face 
    matches = doc.documentElement.innerHTML.match(pattern);

    if (matches) {
    matches.forEach(function(match) {
      while(url = urlPattern.exec(match)) {
        offenders.push(url[1]);
        nrOfInlineFontFace++;
      }
    });
    }
      
    // now the js
    for (i = 0, len = scripts.length; i < len; i++) {
      jscomp = scripts[i];
      if (jscomp.parentNode.tagName === 'HEAD') {
        if (jscomp.src) {
          if (!jscomp.async && !jscomp.defer) {
             if (docDomainTLD !== SITESPEEDHELP.getTLD(YSLOW.util.getHostname(jscomp.src))) {
            offenders.push(jscomp.src);
            nrOfJs++;
            }
          }
        }
      }
    }

    var message = offenders.length === 0  ? '' :
      'There are possible of ' + YSLOW.util.plural('%num% assets', offenders.length) +
        ' that can cause a frontend single point of failure. Javascripts:'  + nrOfJs + ' CSS:' + nrOfCss + ' inlineFontFace:' + nrOfInlineFontFace + ' fontFace in CSS files:' + nrOfFontFaceCssFiles;
    score -= offenders.length * parseInt(config.points, 10);

    return {
      score: score,
      message: message,
      components: offenders
    };
  }
});


/**
Modified version of yexpires, skip standard analythics scripts that you couldn't fix yourself (not 100% but ...)
*/


YSLOW.registerRule({
    id: 'expiresmod',
    name: 'Check for expires headers',
    info: 'All static components of a page should have a far future expire headers. However, analythics scripts will not give you bad points.',
    url: 'http://sitespeed.io/rules/#expires',
    category: ['server'],

    config: {
        // how many points to take for each component without Expires header
        points: 11,
        // 2 days = 2 * 24 * 60 * 60 seconds, how far is far enough
        howfar: 172800,
        // component types to be inspected for expires headers
        // Skipping favicon right now because of a bug somewhere that never even fetch it
        types: ['css', 'js', 'image', 'cssimage', 'flash'], // , 'favicon'],
        skip: ['https://secure.gaug.es/track.js','https://ssl.google-analytics.com/ga.js','http://www.google-analytics.com/ga.js']
    },

    lint: function (doc, cset, config) {
        var ts, i, expiration, score, len, message,
            // far-ness in milliseconds
            far = parseInt(config.howfar, 10) * 1000,
            offenders = [],
            skipped = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            expiration = comps[i].expires;
            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                // looks like a Date object
                ts = new Date().getTime();
                if (expiration.getTime() > ts + far) {
                    continue;
                }
                  // if in the ok list, just skip it
                 else if (config.skip.indexOf(comps[i].url) > 1 ) {
                 skipped.push(comps[i].url);
                 continue;
                }

            }

              offenders.push(comps[i]);
        }

        score = 100 - offenders.length * parseInt(config.points, 10);
       
        message = (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% static component%s%',
                offenders.length
            ) + ' without a far-future expiration date.' : '';

         message += (skipped.length > 0) ? YSLOW.util.plural(' There %are% %num% static component%s% that are skipped from the score calculation', skipped.length) + ":" + skipped : '';

        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});

YSLOW.registerRule({
  id: 'inlinecsswhenfewrequest',
  name: 'Do not load css stylesheet files when the page has few request',
  info: 'When a page has few requests, it is better to inline the css, to make the page to start render as early as possible',
  category: ['css'],
  config: {points: 20, limit: 15,  types: ['css', 'js', 'image', 'cssimage', 'flash', 'favicon']},
  url: 'http://sitespeed.io/rules/#inlinecsswhenfewrequest',

  lint: function (doc, cset, config) {
  
  
  var comps = cset.getComponentsByType(config.types),
  css = cset.getComponentsByType('css'), message = '', score = 100, offenders = [];

  // If we have more requests than the set limit & we have css files, decrease the score
  if (comps.length < config.limit && css.length > 0) {
  
    for (i = 0, len = css.length; i < len; i++) {
      offenders.push(css[i].url); 
    }

    message = 'The page have ' +  comps.length + ' requests and uses ' + css.length + ' css files. It is better to keep the css inline, when you have so few requests.';
    score -= offenders.length * parseInt(config.points, 10);

  }

  return {
            score: score,
            message: message,
            components: offenders
        };
      }
});

YSLOW.registerRule({
  id: 'nodnslookupswhenfewrequests',
  name: 'Avoid DNS lookups when the page has few request',
  info: 'If you have few prequest on a page, they should all be to the same domain to avoid DNS lookups, because the lookup will take extra time',
  category: ['content'],
  config: {points: 20, limit: 10,  types: ['css', 'image', 'cssimage', 'flash', 'favicon']},
  url: 'http://sitespeed.io/rules/#nodnslookupswhenfewrequests',

  lint: function (doc, cset, config) {

  var domains, comps = cset.getComponentsByType(config.types),
  score = 100, message = '', offenders = [];
  syncJs = SITESPEEDHELP.getSynchronouslyJavascripts(cset.getComponentsByType('js'));

  // Add the js files that are loaded sync
  for (i = 0, len = syncJs.length; i < len; i++) {
    comps.push(syncJs[i]);
  }

  domains = YSLOW.util.getUniqueDomains(comps);

  // Only activate if the number of components are less than the limit 
  // and we have more than one domain
  if (comps.length < config.limit && domains.length > 1) {
    for (i = 0, len = comps.length; i < len; i++) {
      offenders.push(comps[i].url); 
    }
    message = 'Too many domains (' + domains.length + ') used for a page with only ' + comps.length + ' requests (async javascripts not included)';
    score -= offenders.length * parseInt(config.points, 10);
  }

  return {
            score: score,
            message: message,
            components: offenders
        };
  }
});


YSLOW.registerRuleset({ 
    id: 'sitespeed.io-1.5',
    name: 'Sitespeed.io rules v1.5',
    rules: {
        criticalpath: {},
        spof: {},
        ynumreq: {
	         // We are a little harder than standard yslow
	         // the number of scripts allowed before we start penalizing
	         max_js: 2,
	         // number of external stylesheets allowed before we start penalizing
	         max_css: 2,
	         // number of background images allowed before we start penalizing
	         max_cssimages: 2
        },
        yemptysrc: {},
        ycompress: {},
        ycsstop: {},
        yjsbottom: {},
        yexpressions: {},
        yexternal: {},
        ydns: {},
        yminify: {},
        yredirects: {},
        ydupes: {},
        yetags: {},
        yxhr: {},
        yxhrmethod: {},
        ymindom: {},
        yno404: {},
        ymincookie: {},
        ycookiefree: {},
        ynofilter: {},
        yimgnoscale: {},
        // skipping favicon for now, since it don't seems to work with phantomjs, always get size 0 and no cache header
        // yfavicon: {},
        _3po_asyncjs: {},
	      _3po_jsonce: {},
        cssprint: {},
        cssinheaddomain: {},
        syncjsinhead: {},
        avoidfont: {},
        totalrequests: {},
        expiresmod: {},
        nodnslookupswhenfewrequests:{},
        inlinecsswhenfewrequest:{}
        

    },
    weights: {
        criticalpath: 15,
        // Low since we fetch all different domains, not only 3rd parties
        spof: 5,
        ynumreq: 8,
        yemptysrc: 30,
        ycompress: 8,
        ycsstop: 4,
        yjsbottom: 4,
        yexpressions: 3,
        yexternal: 4,
        ydns: 3,
        yminify: 4,
        yredirects: 4,
        ydupes: 4,
        yetags: 2,
        yxhr: 4,
        yxhrmethod: 3,
        ymindom: 3,
        yno404: 4,
        ymincookie: 3,
        ycookiefree: 3,
        ynofilter: 4,
        yimgnoscale: 3,
        // yfavicon: 2,
        _3po_asyncjs: 10,
		    _3po_jsonce: 10,
        cssprint: 3,
        cssinheaddomain: 8,
        syncjsinhead: 20,
        avoidfont: 1,
        totalrequests: 10,
        expiresmod: 10,
        nodnslookupswhenfewrequests: 8,
        inlinecsswhenfewrequest: 7

    }

});