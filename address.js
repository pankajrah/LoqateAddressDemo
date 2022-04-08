(function () {
    window.lqt = window.lqt || {};
    lqt.AllInOneDemo = (function () {
        var init;
        var startedTyping = false;
        var demoKey = 'FC59-CX45-XD13-MU79';
        var shouldStartAutoDemo = true;
        var autoSearching = false;
        var typedInView = false;
        var resetAutoDemoInterval = null;

        var noFree = '<h4>Sorry, looks like you\'ve used your free look-ups.</h4> Why not create a free account and try our capture services in your website too? <a href="https://account.loqate.com/register/">Sign up for free.</a>';
		
		var fieldmaps = {
            "input_id": "id",
            "txtCompany": "Organization",
            "txtAddress": "Address",
            "txtLine1": "Address1",
            "txtLine2": "Address2",
            "txtLine3": "Address3",
            "txtLine4": "Address4",
            "txtCity": "Locality",
			//state
            "txtPostcode": "PostalCode",
            "ddlCountry": "Country"
        };

        if (typeof pca !== 'undefined') {
            var fields = [
                { element: "txtAddress", field: "Line1", mode: pca.fieldMode.SEARCH },
                { element: "txtCompany", field: "Company", mode: pca.fieldMode.DEFAULT | pca.fieldMode.PRESERVE },
                { element: "txtLine1", field: "Line1", mode: pca.fieldMode.POPULATE },
                { element: "txtLine2", field: "Line2", mode: pca.fieldMode.POPULATE },
                { element: "txtLine3", field: "Line3", mode: pca.fieldMode.POPULATE },
                { element: "txtLine4", field: "Line4", mode: pca.fieldMode.POPULATE },
                { element: "txtCity", field: "City", mode: pca.fieldMode.POPULATE },
                { element: "txtState", field: "Province", mode: pca.fieldMode.POPULATE },
                { element: "txtPostcode", field: "PostalCode" },
                { element: "ddlCountry", field: "CountryName", mode: pca.fieldMode.COUNTRY }
            ],
                options = {
                    key: demoKey,
                    bar: { visible: true },
                    GeoLocationEnabled: 'false',
                    GeoLocationRadius: 50,
                    GeoLocationMaxItems: 10,
                    setCountryByIP: true,
                    suppressAutocomplete: false
                },
                controlFinder = '';
        }


        Init = function () {

            setLanguage(demoLanguage);
            if (demoKeyOverride !== '') {
                setDemoKey(demoKeyOverride);
            }
            options.key = demoKey;

            if (geoLocation) {
                options.GeoLocationEnabled = 'true';
            }
            controlFinder = new pca.Address(fields, options);
            setUpAddressDemo();   

			$('#run_process').click(function () {
                Begin();
            });			

        };
				
		//Address Populate
        function setUpAddressDemo() {
            listenForTyping();
            listenForAddress();
            listenForError();
            listenForReturnKey();
            listenForInteraction();
            listenForMobileMenu();
        }

        function listenForTyping() {
            controlFinder.listen('search', function () {
                if (!startedTyping) {
                    startedTyping = true;
                }
            });
        }

        function listenForAddress() {
            controlFinder.listen('populate', function (address) {
                $('.inset-demo .container').show();
                hideAddressComponents();
                $('.address-label').show();
                $('.address-label span').html('');
                $('.address-label span').append(address.Label.replace(new RegExp('\r?\n', 'g'), '<br />'));
                document.getElementById('txtAddress').value = '';
                $('#txtAddress').blur();
                startedTyping = false;
            });
        }

        function listenForInteraction() {
            $('#txtAddress').focus(function (e) {
                shouldStartAutoDemo = false;
                if (resetAutoDemoInterval !== null) {
                    clearTimeout(resetAutoDemoInterval);
                }
            });
        }

        function listenForError() {
            controlFinder.listen("error", showErrorFinder);
        }

        function listenForReturnKey() {
            $('#txtAddress').keydown(function (e) {
                if (e.keyCode === 13) {
                    return false;
                }
            });
        }

        function showErrorFinder(error) {
            var message = "";
            shouldStartAutoDemo = false;
            if (autoSearching) window.cancelDemo();
            document.getElementById('txtAddress').value = '';

            if (error === null || ~error.toLowerCase().indexOf("no response") || ~error.toLowerCase().indexOf("request failed")) {
                //ignore
            }
            else {
                message = noFree;
                $(".search").attr('disabled', 'true');
                $(".recentFavourites").css('visibility', 'hidden');
                document.getElementById('txtAddress').disabled = true;
                controlFinder.hide();
                document.getElementById('txtAddress').blur();
            }

        }

        function listenForMobileMenu() {
            $('.mobile-only-menu-button')
                .click(function () {
                    //cancel the auto-play demo
                    if (resetAutoDemoInterval !== null) {
                        clearTimeout(resetAutoDemoInterval);
                    }
                    shouldStartAutoDemo = false;
                    window.cancelDemo;
                });
        }

        //Address Validate
		Begin = function () {
            if ($('#input_country').val() === '') {
                //utility.showDemoError('Please provide a country.');
                return;
            }
            if ($('#input_addr').val() === '' && $('#input_address1').val() === '') {
                //utility.showDemoError('Please provide an address.');
                return;
            }

            var strUrl = 'https://api.addressy.com/Cleansing/International/Batch/v1.00/json4.ws';
            var outputScript = $('#input_script :selected').val();
            var serverOptions = { 'FieldStatus': true };
            if (outputScript !== 'default') serverOptions = { 'FieldStatus': true, 'OutputScript': outputScript };
            var options = { 'Options': { 'Certify': $('#checkCertify').is(':checked'), 'ServerOptions': serverOptions, 'Version': true } };// 'Enhance': $('#checkEnhance').is(':checked') , 'Process': $('#input_process :selected').val(), 'ServerOptions':  serverOptions }};

            var dataQuery = { 'Key': demoKey, 'Geocode': $('#checkGeocode').is(':checked') };
            var addresses = { 'Addresses': [get_field_content('address-fields')] };
            dataQuery = $.extend(dataQuery, addresses, options);


            //utility.clearDemoError();

            var temp = jQuery.ajax({
                crossDomain: true,
                type: "POST",
                //dataType: "json",
                contentType: "application/json; charset=utf-8",
                url: strUrl,
                data: JSON.stringify(dataQuery),
                async: true,
                beforeSend: function () {
                    //$("#run_process").text("Loading...");
                    $('#run_process').addClass('working');
                },
                error: function (data) {
                    //alert("Please ensure to provide a country");
                    //utility.showDemoError('Sorry, it looks like something went wrong. Please try again.');
                    $("#run_process").text("Run Process");
                    $('#run_process').removeClass('working');
                    $('#api-version').html('API Version: ' + data[0].Version);
                },
                success: function (data) {
                    $('.output-results').show();
                    $("#run_process").text("Run Process");
                    $('#run_process').removeClass('working');
                    $('#api-version').html('API Version: ' + data[0].Version);
                    if (typeof data !== "undefined" && data) {
                            
                        if (data.Number && data.Number === '2') {
                            //utility.showDemoError('Error: ' + data.ErrorMessage);
                            return;
                        }
                        OutputResults(data[0]);
                    }
                }
            });
            return temp;
        };
		
		function get_field_content(containerClass) {
            var addrfields = {};
            
			addrfields["Address"]=$('#txtAddress').val();
			addrfields["Organization"]=$('#txtCompany').val();
			addrfields["Address1"]=$('#txtLine1').val();
			addrfields["Address2"]=$('#txtLine2').val();
			addrfields["Address3"]=$('#txtLine3').val();
			addrfields["Address4"]=$('#txtLine4').val();
			addrfields["Locality"]=$('#txtCity').val();
			addrfields["PostalCode"]=$('#txtPostcode').val();
			addrfields["Country"]="India";
            return addrfields;

        }
		
		function OutputResults(results) {

            data = results.Matches[0];

            $('.demo-skin__main--output input').val('');
            $('#addblock1').html('');


            if ($('#checkGeocode').is(':checked')) {
                $('#geocoding_results').show();
            } else {
                $('#geocoding_results').hide();
            }
            //utility.scrollToElement('outputData');

            var iso = '';
            if (data['ISO3166-2'] !== '') iso += data['ISO3166-2'] + ', ';
            if (data['ISO3166-3'] !== '') { iso += data['ISO3166-3'] + ', '; if (data['ISO3166-3'] === 'ISR') { $('#out_country').val('Israel'); } } // DK MARCH 11 2013 TEMP FIX. JIRA LOG.
            if (data['ISO3166-N'] !== '') iso += data['ISO3166-N'] + ', ';
            $('#out_iso').val(iso.substring(0, iso.length - 2));
            
            if (data['GeoAccuracy']) {

                var explgeo = "";
                var nm = data["GeoAccuracy"].split("");
                explgeo += geo_levelrel[nm[0]] + ", " + geo_levelrel[nm[1]];

                $('#out_gac').val(data['GeoAccuracy'] + ' (' + explgeo + ')');

                var geod_string = (typeof data["GeoDistance"] === 'undefined' ? "n/a" : data["GeoDistance"] + " meters");

                var refer = "http://www.bing.com/maps/default.aspx?v=2&cp=" + data["Latitude"] + "~" + data["Longitude"] + "&lvl=16&sp=Point." + data["Latitude"] + "_" + data["Longitude"] + "_Geocode%20Address%20(" + data["GeoAccuracy"] + ")_Geo-Distance:%20" + geod_string;
                $("#maplink").html("View map").attr("href", refer).show();

            }

            var address = '';

            for (var f in data) {
                switch (f) {
                    case 'Address1':
                    case 'Address2':
                    case 'Address3':
                    case 'Address4':
                    case 'Address5':
                    case 'Address6':
                    case 'Address7':
                    case 'Address8':
                        address += addAddressLine(data[f]);
                        break;
                    case 'FieldStatus':

                        break;
                    default:
                        break;
                }
            }
            $('#addblock1').html(address);
        }

		function addAddressLine(line) {
            if (line !== '') return line + '<br />';
            return '';
        }
		
		
		//Common
		setLanguage = function (lang) {
            language = lang;
            switch (language) {
                case 'en':
                    //default
                    break;
                case 'de':
                    noFree = '<h4>Entschuldige, du hast deine 5 kostenfreien Prüfungen für heute aufgebraucht.</h4>Registriere dir doch einen kostenlosen Account und teste unsere Adressvalidierung direkt in deinem Checkout. <a href="https://account.loqate.com/register/">Jetzt anmelden.</a>';
                    break;
            }
        };

        
        setGeoLocation = function (isSet) {
            if (isSet) {
                controlFinder.options.GeoLocationEnabled = 'true';
            } else {
                controlFinder.options.GeoLocationEnabled = 'false';
            }
        };

        setDemoKey = function (key) {
            demoKey = key;
        };
		
		return {
            Init: Init,
            setDemoKey: setDemoKey,
            setGeoLocation: setGeoLocation,
            
        };
    }());

    $(function () {
        lqt.AllInOneDemo.Init();
    });
})();