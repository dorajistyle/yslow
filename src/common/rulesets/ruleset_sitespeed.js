/*
Rule borrowed from Stoyan Stefanov
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
    'assets.pinterest.com'
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
      'The following ' + YSLOW.util.plural('%num% script%s%', offender_comps.length) +
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


YSLOW.registerRule({
  id: 'cssprint',
  name: 'Do not load print stylesheets, use @media',
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
          'There %are% %num% print css files included on the page',
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
 
  var scripts = doc.getElementsByTagName('link'), 
    comps = cset.getComponentsByType('css'),
    comp, docdomain, src, offenders = {}, 
    offender_comps = [],  
    score = 100;
  
    docdomain = YSLOW.util.getHostname(cset.doc_comp.url);

    for (i = 0, len = scripts.length; i < len; i++) {
      comp = scripts[i];
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
          offender_comps.push(comps[i]);
        }
      }
    }

    var message = offender_comps.length === 0 ? '' :
      'The following ' + YSLOW.util.plural('%num% css', offender_comps.length) +
        ' are loaded from a different domain inside head';
    score -= offender_comps.length * parseInt(config.points, 10)
  
    return {
      score: score,
      message: message,
      components: offender_comps
    };
    }
});


/** Alternative to yjsbottom rule that doesn't seems to work right now 
with phantomjs 
*/
YSLOW.registerRule({
  id: 'syncjsinhead',
  name: 'Never load JS synchronously in head',
  info: "Use the JavaScript snippets that load the JS files asynchronously in head " +
        "in order to speed up the user experience.",
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
      'The following ' + YSLOW.util.plural('%num% script%s%', offender_comps.length) +
        ' not loaded asynchronously in head:';
    score -= offender_comps.length * parseInt(config.points, 10)
  
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
  info: "Fonts slow down the page load, try to avoid them",
  category: ['css'],
  config: {points: 10},
  url: 'http://sitespeed.io/rules/#avoidfonts',

  lint: function (doc, cset, config) {

    var comps = cset.getComponentsByType('font'),
    score;

    score = 100 - comps.length * parseInt(config.points, 10);

    var message = comps.length === 0 ? '' :
      'The following ' + YSLOW.util.plural('%num% font%s%', comps.length) +
        ' will add extra overhead.';    

    return {
      score: score,
      message: message,
      components: comps
    };
  }
});


YSLOW.registerRuleset({ 
    id: 'sitespeed',
    name: 'Sitespeed.io rules v0.8',
    rules: {
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
        yexpires: {},
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
        yfavicon: {},
        _3po_asyncjs: {},
	      _3po_jsonce: {},
        cssprint: {},
        cssinheaddomain: {},
        syncjsinhead: {},
        avoidfont: {}
    },
    weights: {
        ynumreq: 8,
        yemptysrc: 30,
        yexpires: 10,
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
        yfavicon: 2,
        _3po_asyncjs: 10,
		    _3po_jsonce: 10,
        cssprint: 1,
        cssinheaddomain: 8,
        syncjsinhead: 10,
        avoidfont: 1	
    }

});