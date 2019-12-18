function GetUrlValue(VarSearch) {
	var SearchString = window.location.search.substring(1);
	var VariableArray = SearchString.split('&');
	for (var i = 0; i < VariableArray.length; i++) {
		var KeyValuePair = VariableArray[i].split('=');
		if (KeyValuePair[0] == VarSearch) {
			return KeyValuePair[1];
		}
	}
}

var HELP_ITEM_ID = 'helpItemId';
var CONTENUTO_HTML = 'contenutoHtml';
var CONTENUTO = 'contenuto';
var IMMAGINE = 'immagine';
var LINGUA = 'lingua';
var LEGENDA = 'legenda';
var CONTENUTO_RST = 'contenutoRst';
var ORDINAMENTO = 'ordinamento';
var TITOLO = 'titolo';

var URL_WS_HELP = 'http://localhost:19080/wgt/services/help';
// var URL_WS_HELP = '${api_url}' + '/help';

var VERSION = 'version_d';

$(document).ready(function () {

	//var url = "https://www.googleapis.com/fusiontables/v1/query";
	var id = parseInt(GetUrlValue('id')) || 1;
//    var langa = GetUrlValue('lang') || 'it';
	var langa = 'it'; // only italian language available at the moment for help

	// var googleKey = 'AIzaSyB4UaUWkInutW04bsmqQCu5zwlM79GmdYc';
	// var tableId = '125wKuuSxLLSkHM90Qell0z2O69ayMFCgmq45J1aM';

	var rootSite = './';

	// redirect draw/measure --> function

	// var mockUrl = "http://demo0263711.mockable.io/test";

	if (langa == 'de') {
		var lang = 'de';}
	else if (langa == 'fr') {
		var lang = 'fr';}
	else if (langa == 'it') {
		var lang = 'it';}
	else if (langa == 'en') {
		var lang = 'en';}
	else if (langa == 'rm') {
		var lang = 'de';}

	if (id && lang) {

		// connexion Google Drive Fusion Table

//	console.log("select * from "+tableId+" where col0=" + id + " and col5='" + lang + "'");

		$.ajax({
			type: "GET",
			// url: url,
			url: URL_WS_HELP+'?id='+id+'&lang='+lang,
			dataType: "json",
			cache: false,
			contentType: "application/json",
			// data: {
			//     key: googleKey,
			//     sql: "select * from "+tableId+" where col0=" + id + " and col5='" + lang + "'"
			// },
			success: function (msg) {

				console.log('script 1', VERSION, URL_WS_HELP+'?id='+id+'&lang='+lang);
				console.log(msg);

				var selectLang = $('<div id="selectLang">');
				var dl = $('<dl>');
				var heading = $('<div id="heading">');

				// var row = msg.rows[0];
				var row = msg[0];


				var title = row[TITOLO];
				var content = row[CONTENUTO] ? row[CONTENUTO].replace(/[\n\r]/g, '<br>').replace(/\[/g,'<a href="').replace(/\]/g,'" target="_blank"><b><span style="padding-right:20px; background: url(ico_extern.gif) no-repeat 26px 1px;"> Link </span></b></a>').replace(/<b1>/g,'<b>').replace(/<b2>/g,'</b>') : '';
				var legend = row[LEGENDA] ? row[LEGENDA].replace(/[\n\r]/g, '<br>') : '';
				var image = row[IMMAGINE];

				console.log(row);
				console.log(title, content, legend, image);
				console.log('/*/*/*/*');


				function getImage(){
					if (row[4]){
						return '<img src="' + (rootSite + 'img/' + image) + '">';
					}
					return '';
				}


				// Exception Homepage

				if (id == 1){

//			console.log(getImage());

					dl.append('<p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend></dl>');
					selectLang.append('<a href="'+rootSite+'?id=01&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id=01&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id=01&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id=01&lang=en" target="_self">EN</a>');

					$('#helpSection').append(dl);
					// $('#headingSection').append(selectLang);
				}

				// Exception id 54 with iFrame

				else if (id == 54){

//				console.log(image);

					if (lang == 'fr'){
						dl.append('<h2>' + title + '</h2><p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend>' + '<iframe src="special/parameter_fr.html" width="570" height="1300" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe></dl>');
						selectLang.append('<a href="'+rootSite+'?id='+ id + '&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=en" target="_self">EN</a>');

						$('#helpSection').append(dl);
						// $('#headingSection').append(selectLang);
					}
					if (lang == 'it'){
						dl.append('<h2>' + title + '</h2><p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend>' + '<iframe src="special/parameter_it.html" width="570" height="1300" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe></dl>');
						selectLang.append('<a href="'+rootSite+'?id='+ id + '&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=en" target="_self">EN</a>');

						$('#helpSection').append(dl);
						// $('#headingSection').append(selectLang);
					}
					if (lang == 'de'){
						dl.append('<h2>' + title + '</h2><p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend>' + '<iframe src="special/parameter.html" width="570" height="1300" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe></dl>');
						selectLang.append('<a href="'+rootSite+'?id='+ id + '&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=en" target="_self">EN</a>');

						$('#helpSection').append(dl);
						// $('#headingSection').append(selectLang);
					}
					if (lang == 'en'){
						dl.append('<h2>' + title + '</h2><p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend>' + '<iframe src="special/parameter_en.html" width="570" height="1300" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe></dl>');
						selectLang.append('<a href="'+rootSite+'?id='+ id + '&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=en" target="_self">EN</a>');


						$('#helpSection').append(dl);
						// $('#headingSection').append(selectLang);
					}

					// Content displayed in normal case

				}

				else{

					dl.append('<h2>' + title + '</h2><p>' + content + '</p>' + '<br>' + getImage() + '<br><br>' + '<legend>' + legend + '</legend></dl>');
					selectLang.append('<a href="'+rootSite+'?id='+ id + '&lang=de" target="_self">DE</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=fr" target="_self">FR</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=it" target="_self">IT</a><a>&nbsp;|&nbsp;<a/><a href="'+rootSite+'?id='+ id + '&lang=en" target="_self">EN</a>');


					$('#helpSection').append(dl);
					//$('#headingSection').append(selectLang);
				}

				if (lang == 'de')
				{heading.append('<h1>' + 'Hilfe Kartenviewer' + '</h1>');}
				else if (lang == 'fr')
				{heading.append('<h1>' + 'Aide pour le visualisateur de cartes' + '</h1>');}
				else if (lang == 'it')
				{heading.append('<h1>' + 'Aiuto visualizzatore di carte' + '</h1>');}
				else if (lang == 'en')
				{heading.append('<h1>' + 'Mapviewer Help' + '</h1>');}
				$('#headingSection').append(heading);
			}

		});
	}

	// Menu left display

	if ((id || 1) && (lang || de)) {

		// connexion Google Drive Fusion Table

		$.ajax({
			type: "GET",
			// url: url,
			url: URL_WS_HELP+'?lang='+lang,
			dataType: "json",
			cache: false,
			contentType: "application/json",
			// data: {
			//     key: googleKey,
			//     sql: 'select * from '+tableId+' where col5 = \''+lang + '\' order by col8'
			// },
			success: function (msg) {

				console.log('script 2', VERSION,  URL_WS_HELP+'?lang='+lang);
				console.log(msg);

				var dt = $('<dt>');
				var dx1 = $('<div id="dx1">');
				var dx2 = $('<div id="dx2">');
				var dx3 = $('<div id="dx3"><a href="/wgt/" target="_self"><span style="font-size:13px">&#8678;</span> WebGIS PAT</div>');


				if (msg && msg instanceof Array){
					msg.forEach(function (item, index) {

						var	ids = item[HELP_ITEM_ID],
							titles = item[TITOLO] ? item[TITOLO].replace(/[\n\r]/g, '<br>') : '',

							contents = item[CONTENUTO],
							languages = item[LINGUA];
						// console.log(ids, titles);

						console.log(item);
						console.log(titles, contents, languages);

						if (lang == languages && contents !== '#' && ids == id && id == 1) {
							dx1.append('<a>'+titles+'</a>');
						}	else if (lang == languages && contents !== '#' && ids == id && id !== 1) {
							dt.append('<span style="color:#ff0000; font-size:0.9em; padding-left:20px; background: url(img/arrow.png) no-repeat 10px 2px;">'+titles+'</span></a><br>');
						}	else if (lang == languages && contents !== '#' && ids == 1) {
							dx2.append('<a href="'+rootSite+'?id='+ ids + '&lang='+ languages +'" target="_self">'+titles+'</a><br>');
						}	else if (lang == languages && contents !== '#') {
							dt.append('<a href="'+rootSite+'?id='+ ids + '&lang='+ languages +'" target="_self">'+titles+'</a><br>');
						}	else if (lang == languages && contents == '#'){
							dt.append('<h3>' + titles + '</h3>');
						}

					});
				}

				// $.each(msg, function (row) {
				//
				// 	// var row = this;
				// 	var	ids = row[HELP_ITEM_ID],
				// 		titles = row[TITOLO] ? row[TITOLO].replace(/[\n\r]/g, '<br>') : '',
				// 		contents = row[CONTENUTO],
				// 		languages = row[LINGUA];
				// 	// console.log(ids, titles);
				//
				// 	console.log(row);
				// 	console.log(titles, contents, languages);
				//
				// 	if (lang == languages && contents !== '#' && ids == id && id == 1) {
				// 		dx1.append('<a>'+titles+'</a>');
				// 	}	else if (lang == languages && contents !== '#' && ids == id && id !== 1) {
				// 		dt.append('<span style="color:#ff0000; font-size:0.9em; padding-left:20px; background: url(img/arrow.png) no-repeat 10px 2px;">'+titles+'</span></a><br>');
				// 	}	else if (lang == languages && contents !== '#' && ids == 1) {
				// 		dx2.append('<a href="'+rootSite+'?id='+ ids + '&lang='+ languages +'" target="_self">'+titles+'</a><br>');
				// 	}	else if (lang == languages && contents !== '#') {
				// 		dt.append('<a href="'+rootSite+'?id='+ ids + '&lang='+ languages +'" target="_self">'+titles+'</a><br>');
				// 	}	else if (lang == languages && contents == '#'){
				// 		dt.append('<h3>' + titles + '</h3>');
				// 	}
				// });
				$('#headingSection').append(dx1);
				$('#headingSection').append(dx2);
				$('#headingSection').append(dx3);
				$('#menuHelp').append(dt);
			}

		});
	}

});
