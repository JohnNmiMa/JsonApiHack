$(function() {
	$("#symbolLookup").focus().autocomplete({

		// Define callback to format results
		source: function(request,response) {

			// Pass request to server
			$.ajax({
				beforeSend: function(){ 
					$("span.help-inline").removeClass('hide');
					//$("span.label-info").empty().hide();
				},
				url: "http://dev.markitondemand.com/api/v2/Lookup/jsonp",
				dataType: "jsonp",
				data: {
					input: request.term
				},
				success: function(data) {
					response( $.map(data, function(item) {
						return {
							label: item.Name + " (" +item.Exchange+ ")",
							value: item.Symbol
						}
					}));
					$("span.help-inline").addClass('hide');
				}
			});
		},

		// The minimum number of characters to type before the search is performed
		minLength: 0,

		// Triggered when an item is selected from the menu.
		select: function( event, ui ) {
			//console.log(ui.item);
			//$("span.label-info").html("You selected " + ui.item.label).fadeIn("fast");
		},

		// Triggered when the suggestion menu is opened or updated
		open: function() {
			//$(this).removeClass("ui-corner-all").addClass("ui-corner-top");
		},

		// Triggered when the menu is hidden
		close: function() {
			//$(this).removeClass("ui-corner-top").addClass("ui-corner-all");
		}
	});
});

