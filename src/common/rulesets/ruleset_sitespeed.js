// Rule file for sitespeed.io

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

// end of borrow :)

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

// Inspired by dom monster http://mir.aculo.us/dom-monster/
SITESPEEDHELP.getTextLength = function (element) {

var avoidTextInScriptAndStyle = ("script style").split(' ');
var textLength = 0;

function getLength(element){
  if(element.childNodes && element.childNodes.length>0)
    for(var i=0;i<element.childNodes.length;i++)
      getLength(element.childNodes[i]);
    if(element.nodeType==3 && avoidTextInScriptAndStyle.indexOf(element.parentNode.tagName.toLowerCase())==-1)
      textLength += element.nodeValue.length; 
}

getLength(element);
return textLength; 
};


// Borrowed from dom monster http://mir.aculo.us/dom-monster/
 function digitCompare(user, edge) {
    return (~~user || 0) >= (edge || 0);
  }

SITESPEEDHELP.versionCompare = function(userVersion, edgeVersion) {
    if(userVersion === undefined) return true;

    userVersion = userVersion.split('.');

    var major = digitCompare(userVersion[0], edgeVersion[0]),
        minor = digitCompare(userVersion[1], edgeVersion[1]),
        build = digitCompare(userVersion[2], edgeVersion[2]);

    return (!major || major && !minor || major && minor && !build);
  };



SITESPEEDHELP.isSameDomainTLD = function (docDomainTLD, cssUrl, fontFaceUrl) {

// first check the font-face url, is it absolute or relative
if ((/^http/).test(fontFaceUrl)) {
	// it is absolute ...
	 if (docDomainTLD === SITESPEEDHELP.getTLD(YSLOW.util.getHostname(fontFaceUrl))) {
	 return true;
	 }
	 else return false;
}

// it is relative, check if the css is for the same domain as doc 
 else if (docDomainTLD === SITESPEEDHELP.getTLD(YSLOW.util.getHostname(cssUrl))) {
 return true;
 }
 
else return false;

return false;
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

      // Skip print stylesheets for now, since they "only" will make the onload sloooow
      // maybe it's better to check for screen & all in the future?
      if (comp.media === 'print') 
        continue;

      else if (src && (comp.rel === 'stylesheet' || comp.type === 'text/css')) {
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
  config: {jsPoints: 10, cssPoints: 8, fontFaceInCssPoints: 8, inlineFontFacePoints: 1},
  url: 'http://sitespeed.io/rules/#spof',

  lint: function (doc, cset, config) {

    var css = doc.getElementsByTagName('link'), 
    scripts = doc.getElementsByTagName('script'), 
    csscomps = cset.getComponentsByType('css'),
    jscomps = cset.getComponentsByType('js'),
    docDomainTLD, src, url, matches, offenders = [], insideHeadOffenders = [], 
    nrOfInlineFontFace = 0, nrOfFontFaceCssFiles = 0, nrOfJs = 0, nrOfCss = 0,
    // RegEx pattern for retrieving all the font-face styles, borrowed from https://github.com/senthilp/spofcheck/blob/master/lib/rules.js
    pattern = /@font-face[\s\n]*{([^{}]*)}/gim, 
    urlPattern = /url\s*\(\s*['"]?([^'"]*)['"]?\s*\)/gim,
    fontFaceInfo = '',
    score = 100;
  
    docDomainTLD = SITESPEEDHELP.getTLD(YSLOW.util.getHostname(cset.doc_comp.url));

    // Check for css loaded in head, from another domain (not subdomain)  
    for (i = 0, len = css.length; i < len; i++) {
      csscomp = css[i];
            src = csscomp.href || csscomp.getAttribute('href');

            // Skip print stylesheets for now, since they "only" will make the onload sloooow
            // maybe it's better to check for screen & all in the future?
            if (csscomp.media === 'print') 
              continue;

            if (src && (csscomp.rel === 'stylesheet' || csscomp.type === 'text/css')) {
               if (csscomp.parentNode.tagName === 'HEAD') {
               insideHeadOffenders[src] = 1;
               }
            }
        }
	
	for (var i = 0; i < csscomps.length; i++) {
      if (insideHeadOffenders[csscomps[i].url]) {
        if (docDomainTLD !== SITESPEEDHELP.getTLD(YSLOW.util.getHostname(csscomps[i].url))) {
          offenders.push(csscomps[i]);
          nrOfCss++;
        }
      }
    }

	
    // Check for font-face in the external css files
    for (var i = 0; i < csscomps.length; i++) {

      matches = csscomps[i].body.match(pattern);
      if(matches) {
       matches.forEach(function(match) {
	while(url = urlPattern.exec(match)) {
		if (!SITESPEEDHELP.isSameDomainTLD(docDomainTLD, csscomps[i].url, url[1])) 
		{
		// we have a match, a fontface user :)
		offenders.push(url[1]);
		nrOfFontFaceCssFiles++;
		fontFaceInfo += ' The font file:' + url[1] + ' is loaded from ' + csscomps[i].url;
	}
        }
        });
      }
    }
  

    // Check for inline font-face 
   
    matches = doc.documentElement.innerHTML.match(pattern);

    if (matches) {
    matches.forEach(function(match) {
      while(url = urlPattern.exec(match)) {
	     if (!SITESPEEDHELP.isSameDomainTLD(docDomainTLD, cset.doc_comp.url, url[1])) {
	       offenders.push(url[1]);
	       nrOfInlineFontFace++;
	       fontFaceInfo += ' The font file:' + url[1] + ' is loaded inline.';

        }
      }
    });
    }
  
  
    // now the js
    for (i = 0, len = scripts.length; i < len; i++) {
      jscomp = scripts[i];
      if (jscomp.parentNode.tagName === 'HEAD') {
        if (jscomp.src) {
          if (!jscomp.async && !jscomp.defer) {
            insideHeadOffenders[jscomp.src] = 1;
          }
        }
      }
    }

    for (var i = 0; i < jscomps.length; i++) {
      if (insideHeadOffenders[jscomps[i].url]) {
          if (docDomainTLD !== SITESPEEDHELP.getTLD(YSLOW.util.getHostname(jscomps[i].url))) {
          offenders.push(jscomps[i]);
           nrOfJs++;
        }
      }
    }


    var message = offenders.length === 0  ? '' :
      'There are possible of ' + YSLOW.util.plural('%num% assets', offenders.length) +
        ' that can cause a frontend single point of failure. ';

    message += nrOfJs === 0 ? '' : 'There are ' +  YSLOW.util.plural('%num% javascript',nrOfJs) + ' loaded from another domain that can cause SPOF. ';    
    message += nrOfCss === 0 ? '' : 'There are ' +  YSLOW.util.plural('%num% css ',nrOfCss) + ' loaded from another domain that can cause SPOF. ';
    message += nrOfFontFaceCssFiles === 0 ? '' : 'There are ' +  YSLOW.util.plural('%num%',nrOfFontFaceCssFiles) + ' font face in css files that can cause SPOF. ' + fontFaceInfo;
    message += nrOfInlineFontFace === 0 ? '' : 'There are ' +  YSLOW.util.plural('%num% ',nrOfInlineFontFace) + ' inline font face that can cause minor SPOF. ' + fontFaceInfo;
    score -= nrOfJs * config.jsPoints + nrOfCss * config.cssPoints + nrOfInlineFontFace * config.inlineFontFacePoints + nrOfFontFaceCssFiles * config.fontFaceInCssPoints;

    return {
      score: score,
      message: message,
      components: offenders
    };
  }
});


/**
Modified version of yexpires, skip standard analythics scripts that you couldn't fix yourself (not 100% but ...) and will
only give bad score for assets with 0 expires.
*/


YSLOW.registerRule({
    id: 'expiresmod',
    name: 'Check for expires headers',
    info: 'All static components of a page should have a future expire headers.',
    url: 'http://sitespeed.io/rules/#expires',
    category: ['server'],

    config: {
        // how many points to take for each component without Expires header
        points: 11,
        // component types to be inspected for expires headers
        // Skipping favicon right now because of a bug somewhere that never even fetch it
        types: ['css', 'js', 'image', 'cssimage', 'flash'] // , 'favicon'],
    },

    lint: function (doc, cset, config) {
        var ts, i, expiration, score, len, message,
            offenders = [],
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            expiration = comps[i].expires;
            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                
                // check if the server has set the date, if so 
                // use that http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18 
                if (typeof comps[i].headers.date === 'undefined') {
                	ts = new Date().getTime();                	
                }
                else
                 ts = new Date(comps[i].headers.date).getTime();
                
                if (expiration.getTime() > ts) {
                    continue;
                }
            }

              offenders.push(comps[i]);
        }

        score = 100 - offenders.length * parseInt(config.points, 10);
       
        message = (offenders.length > 0) ? YSLOW.util.plural(
                'There %are% %num% static component%s%',
                offenders.length
            ) + ' without a future expiration date.' : '';

        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});

// skip standard analythics scripts that you couldn't fix yourself (not 100% but ...)
YSLOW.registerRule({
    id: 'longexpirehead',
    name: 'Have expires headers equals or longer than one year',
    info: 'All static components of a page should have at least one year expire header. However, analythics scripts will not give you bad points.',
    url: 'http://sitespeed.io/rules/#longexpires',
    category: ['server'],

    config: {
        // how many points to take for each component without Expires header
        points: 5,
         // Skipping favicon right now because of a bug somewhere that never even fetch it
        types: ['css', 'js', 'image', 'cssimage', 'flash'], // , 'favicon'],
        skip: ['https://secure.gaug.es/track.js','https://ssl.google-analytics.com/ga.js','http://www.google-analytics.com/ga.js']
    },

    lint: function (doc, cset, config) {
        var ts, i, expiration, score, len, message,
            offenders = [],
            skipped = [],
            far = 31535000 * 1000, 
            comps = cset.getComponentsByType(config.types);

        for (i = 0, len = comps.length; i < len; i += 1) {
            expiration = comps[i].expires;
            if (typeof expiration === 'object' &&
                    typeof expiration.getTime === 'function') {
                
                // check if the server has set the date, if so 
                // use that http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.18 
                if (typeof comps[i].headers.date === 'undefined') {
                	ts = new Date().getTime();                	
                }
                else
                 ts = new Date(comps[i].headers.date).getTime();
              
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
            ) + ' without a expire header equal or longer than one year.' : '';

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
  name: 'Do not load css files when the page has few request',
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
  id: 'textcontent',
  name: 'Have a reasonable percentage of textual content compared to the rest of the page',
  info: 'Make sure you dont have too much styling etc that hides the text you want to deliver',
  category: ['content'],
  config: {decimals: 2},
  url: 'http://sitespeed.io/rules/#textcontent',

  lint: function (doc, cset, config) {
  
  var textLength = 0, score = 100, offenders = [], message, contentPercent;

  textLength = SITESPEEDHELP.getTextLength(doc);
  contentPercent = textLength/doc.body.innerHTML.length*100;
  
  if (contentPercent.toFixed(0)<50) {
    score = contentPercent.toFixed(0)*2;
  }

  message = 'The amount of content percentage: ' + contentPercent.toFixed(config.decimals) + '%';
  offenders.push(contentPercent.toFixed(config.decimals));

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
  id: 'thirdpartyasyncjs',
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
    id: 'cssnumreq',
    name: 'Make fewer HTTP requests for CSS files',
    info: 'The more number of CSS requests, the slower the page will be. Combine your css files into one.',
    category: ['css'],
    config: {max_css: 1, points_css: 4},
    url: 'http://sitespeed.io/rules/#cssnumreq',

    lint: function (doc, cset, config) {
          var css = cset.getComponentsByType('css'),
            score = 100, offenders = [],
            message = '';

        if (css.length > config.max_css) {
            score -= (css.length - config.max_css) * config.points_css;
            message = 'This page has ' + YSLOW.util.plural('%num% external stylesheet%s%', css.length) + '. Try combining them into one.';

            for (var i = 0; i < css.length; i++) {
              offenders.push(css[i].url);
            }              
        }
        
        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});


YSLOW.registerRule({
    id: 'cssimagesnumreq',
    name: 'Make fewer HTTP requests for CSS image files',
    info: 'The more number of CSS image requests, the slower the page. Combine your images into one CSS sprite.',
    url: 'http://sitespeed.io/rules/#cssimagsenumreq',
    category: ['css'],
    config: {max_cssimages: 1, points_cssimages: 3},

    lint: function (doc, cset, config) {
            var cssimages = cset.getComponentsByType('cssimage'),
            score = 100, offenders = [], 
            message = '';

        if (cssimages.length > config.max_cssimages) {
            score -= (cssimages.length  -config.max_cssimages) * config.points_cssimages;
            message = 'This page has ' + YSLOW.util.plural('%num% external css image%s%', cssimages.length) + '. Try combining them into one.';
            
            for (var i = 0; i < cssimages.length; i++) {
              offenders.push(cssimages[i].url);
            }    
        }
        return {
            score: score,
            message: message,
            components: offenders
        };
    }
});


YSLOW.registerRule({
  id: 'jsnumreq',
  name: 'Make fewer synchronously HTTP requests for Javascript files',
  info: 'Combine the Javascrips into one.',
  category: ['js'],
  config: { max_js: 1, points_js: 4},
  url: 'http://sitespeed.io/rules/#jsnumreq',

  lint: function (doc, cset, config) {
    var scripts = doc.getElementsByTagName('script'), 
    comps = cset.getComponentsByType('js'),
    comp, offenders = {}, 
    offender_comps = [], message = '', 
    score = 100;
  
    // fetch all js that aren't async
    for (i = 0, len = scripts.length; i < len; i++) {
      comp = scripts[i];
        if (comp.src) {
          if (!comp.async && !comp.defer) {
            offenders[comp.src] = 1;
          }
      }
    }

    for (var i = 0; i < comps.length; i++) {
      if (offenders[comps[i].url]) {
        offender_comps.push(comps[i]);
      }
    }


    if (offender_comps.length > config.max_js) { 
    message = 'There are ' + YSLOW.util.plural('%num% script%s%', offender_comps.length) +
        ' loaded synchronously that could be combined into one.';
    score -= (offender_comps.length - config.max_js) * parseInt(config.points_js, 10);
    }
  
    return {
      score: score,
      message: message,
      components: offender_comps
    };
  }
});



// Rewrite of the Yslow rule that don't work for PhantomJS at least
YSLOW.registerRule({
  id: 'noduplicates',
  name: 'Remove duplicate JS and CSS',
  info: 'It is bad practice include the same js or css twice',
  category: ['js','css'],
  config: {},
  url: 'http://developer.yahoo.com/performance/rules.html#js_dupes',
  

  lint: function (doc, cset, config) {
    var i, url, score, len, comp,
        hash = {},
        offenders = [],
        comps = cset.getComponentsByType(['js','css']),
        scripts = doc.getElementsByTagName('script'),
        css = doc.getElementsByTagName('link');

    // first the js
    for (i = 0, len = scripts.length; i < len; i += 1) {
      url = scripts[i].src;
      if (typeof hash[url] === 'undefined') {
        hash[url] = 1;
      } else {
        hash[url] += 1;
      }
    }

    // then the css
    for (i = 0, len = css.length; i < len; i += 1) {
      comp = css[i];
      url = comp.href || comp.getAttribute('href');
      if (url && (comp.rel === 'stylesheet' || comp.type === 'text/css')) {
        if (typeof hash[url] === 'undefined') {
          hash[url] = 1;
        } else {
          hash[url] += 1;
        }
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
          'There %are% %num% js/css file%s% included more than once on the page',
          offenders.length
      ) : '',
      components: offenders
    };
  }
});

// the same rule as ymindom except that it reports the nr of doms 
YSLOW.registerRule({
    id: 'mindom',
    name: 'Reduce the number of DOM elements',
    info: 'The number of dom elements are in correlation to if the page is fast or not',
    url: 'http://developer.yahoo.com/performance/rules.html#min_dom',
    category: ['content'],

    config: {
        // the range
        range: 250,
        // points to take out for each range of DOM that's more than max.
        points: 10,
        // number of DOM elements are considered too many if exceeds maxdom.
        maxdom: 900
    },

    lint: function (doc, cset, config) {
        var numdom = cset.domElementsCount,
            score = 100;

        if (numdom > config.maxdom) {
            score = 99 - Math.ceil((numdom - parseInt(config.maxdom, 10)) /
                parseInt(config.range, 10)) * parseInt(config.points, 10);
        }

        return {
            score: score,
            message: (numdom > config.maxdom) ? YSLOW.util.plural(
                'There %are% %num% DOM element%s% on the page',
                numdom
            ) : '',
            components: [''+numdom]
        };
    }
});

YSLOW.registerRule({
    id: 'thirdpartyversions',
    name: 'Always use latest versions of third party javascripts',
    info: 'Unisng the latest versions, will make sure you have the fastest and hopefully leanest javascripts.',
    url: 'http://sitespeed.io/rules/#thirdpartyversions',
    category: ['js'],
    config: { 
    	// points to take out for each js that is old
        points: 10
        },

    lint: function (doc, cset, config) {
        var message = "",
        score, offenders = 0;

	if(typeof jQuery == 'function'){
		if(SITESPEEDHELP.versionCompare(jQuery.fn.jquery, [1, 9, 1])) {
        	message = "You are using an old version of JQuery: "+ jQuery.fn.jquery + " Newer version is faster & better. Upgrade to the newest version from http://jquery.com/" ;
      		offenders += 1; 	
      }
	}

	score = 100 - offenders * parseInt(config.points, 10);

   	return {
    	score: score,
        message: message,
        components: []
        };
    }
});




/* End */


YSLOW.registerRuleset({ 
    id: 'sitespeed.io-1.8',
    name: 'Sitespeed.io rules v1.8',
    rules: {
        criticalpath: {},
        spof: {},
        cssnumreq: {},
        cssimagesnumreq: {},
        jsnumreq: {},
        yemptysrc: {},
        ycompress: {},
        ycsstop: {},
        yjsbottom: {},
        yexpressions: {},
        yexternal: {},
        ydns: {},
        yminify: {},
        yredirects: {},
        noduplicates: {},
        yetags: {},
        yxhr: {},
        yxhrmethod: {},
        mindom: {},
        yno404: {},
        ymincookie: {},
        ycookiefree: {},
        ynofilter: {},
        yimgnoscale: {},
        // skipping favicon for now, since it don't seems to work with phantomjs, always get size 0 and no cache header
        // yfavicon: {},
        thirdpartyasyncjs: {},
        cssprint: {},
        cssinheaddomain: {},
        syncjsinhead: {},
        avoidfont: {},
        totalrequests: {},
        expiresmod: {},
        longexpirehead: {},
        nodnslookupswhenfewrequests:{},
        inlinecsswhenfewrequest:{},
        textcontent: {},
        thirdpartyversions: {}
    },
    weights: {
    	
        criticalpath: 15,
        // Low since we fetch all different domains, not only 3rd parties
        spof: 5,
        cssnumreq: 8,
        cssimagesnumreq: 8,
        jsnumreq: 8,
        yemptysrc: 30,
        ycompress: 8,
        ycsstop: 4,
        yjsbottom: 4,
        yexpressions: 3,
        yexternal: 4,
        ydns: 3,
        yminify: 4,
        yredirects: 4,
        noduplicates: 4,
        yetags: 2,
        yxhr: 4,
        yxhrmethod: 3,
        mindom: 3,
        yno404: 4,
        ymincookie: 3,
        ycookiefree: 3,
        ynofilter: 4,
        yimgnoscale: 3,
        // yfavicon: 2,
        thirdpartyasyncjs: 10,
        cssprint: 3,
        cssinheaddomain: 8,
        syncjsinhead: 20,
        avoidfont: 1,
        totalrequests: 10,
        expiresmod: 10,
        longexpirehead: 5,
        nodnslookupswhenfewrequests: 8,
        inlinecsswhenfewrequest: 7,
        textcontent: 1,
        thirdpartyversions:5
    }

});