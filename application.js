var Utils = {}
Utils.isNumeric = function(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
}

Utils.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$(document).ready(function() {

	function updateTotalValue() {
		var total = parseFloat(0.0), stockValue = 0.0;
		$('#stockList .stockValue').each(function() {
			if ($(this).parent().find('.stockName').text() != "") {
				var fieldVal = $(this).text();
				if (Utils.isNumeric(fieldVal)) {
					total = parseFloat(total) + parseFloat(fieldVal);
				}
			}
		});
		$('#stockList .stockValue.dummy').text(total.toFixed(2));
	}

	function updateStockValue(event) {
		try {
			var numShares = Number($(this).val()),
	            price = 0,
				value = 0,
				list = '';

			if (!$.isNumeric(numShares) || numShares.length == 0 || numShares <= 0)
				throw new Error("Invalid number entered in # shares field");

			list = $(this).parent();
			price = $(list).find('.stockPrice').text();
			value = (price * numShares).toFixed(2);
			$(list).find('.stockValue').text(value);
			updateTotalValue();
			return false;
		} catch(e) {
			console.log(e.name +': '+ e.message);
		}
	}

	function showRemoveDialog(stockItem) {
		vex.dialog.open({
			contentClassName:'removeDialog', // for styling if needed
			message: "Are you sure you want to remove this stock from the portfolio?",
			callback: function(value) {
				if (value) {
					$(stockItem).remove();
					updateTotalValue();
				}
			},
			buttons: [
				$.extend({}, vex.dialog.buttons.YES, {text: 'Yes'}),
				$.extend({}, vex.dialog.buttons.NO,  {text: 'Cancel'})
			]
		});
	}

	function showQuoteDialog() {
		var symbol = $(this).parent().find('.stockName').text();
		var quote = MarkitOnDemand.quotes[symbol];
		vex.open({
			contentClassName:'quoteDialog',
			content: 
				'<h4 class="quoteName">'         +quote.Name+   '</h3>' +
				'<h5 class="quoteInfo">Price: '  +quote.LastPrice+  '</h5>' +
				'<h5 class="quoteInfo">Open: '   +quote.Open+   '</h5>' +
				'<h5 class="quoteInfo">High: '   +quote.High+   '</h5>' +
				'<h5 class="quoteInfo">Low: '    +quote.Low+    '</h5>' +
				'<h5 class="quoteInfo">Change: ' +quote.Change.toFixed(2)+' ('
												 +quote.ChangePercent.toFixed(2)+ '%)</h5>' +
				'<h5 class="quoteInfo">Volume: ' +Utils.numberWithCommas(quote.Volume)+ '</h5>',
			overlayClassName:'quoteDialogOverlay',
			showCloseButton:false});
	}

	function addSymbol(symbol) {
		var price = MarkitOnDemand.quotes[symbol].LastPrice.toFixed(2);
		var change = MarkitOnDemand.quotes[symbol].Change.toFixed(2);
		var changePcnt = MarkitOnDemand.quotes[symbol].ChangePercent.toFixed(2);
			
		// Create the stock item
		var itemHtml = "<li class='stockItem'>";
		itemHtml += "<img src='trash.ico' class='show'>";
		itemHtml += "<h2 class='stockName'>" + symbol + "</h2>";
		itemHtml += "<h2 class='stockPrice anum'>" + price + "</h2>";
		if (change >= 0)
			itemHtml += "<h2 class='stockChange anum gain'>+" + change + "</h2>";
		else
			itemHtml += "<h2 class='stockChange anum loss'>" + change + "</h2>";
		itemHtml += "<input type='text' class='numShares anum' name='numShares' placeholder='# shares' autocomplete='off'>";
		itemHtml += "<h2 class='stockValue anum'></h2>";
		itemHtml += "</li>"
		var item = $(itemHtml).appendTo('#stockList');

		// Add appropriate event handlers to the new list elements
		var numSharesElem = $(item).find('input');
		$(numSharesElem).change(updateStockValue);
		var priceElem = $(item).find('.stockPrice');
		$(priceElem).click(showQuoteDialog);
		var changeElem = $(item).find('.stockChange');
		$(changeElem).click(showQuoteDialog);
	}

	function getQuote(symbol) {
		new MarkitOnDemand.QuoteService(symbol, function(jsonResult) {
			try {
				if (!jsonResult || jsonResult.Message) {
					throw new Error(jsonResult.Message);
				}
				//console.log(jsonResult);
				addSymbol(jsonResult.Symbol);
			} catch(e) {
				//console.log(e.name +': '+ e.message);
			}
		});
	}

	// Just toggle whatever stock is clicked on. If it is off, toggle it on,
	// and unselect the previously selected stock. If it is the same stock
	// that is already selected, unselect it.
	function selectStockItem(stockItem, symbol) {
		var currentlySelectedStock = $('#stockList li.focused');
		var currentlySelectedStockName = '';
		var duration = 3650;

		if (currentlySelectedStock.length) {
			$(currentlySelectedStock).removeClass('focused');
			$('#chartDemoContainer').empty();

			currentlySelectedStockName = $(currentlySelectedStock).find('.stockName').text();
			if (currentlySelectedStockName != symbol) {
				$(stockItem).addClass('focused');
				new MarkitOnDemand.InteractiveChartApi(symbol, duration);
			}
		} else {
			$(stockItem).addClass('focused');
			new MarkitOnDemand.InteractiveChartApi(symbol, duration);
		}
	}

	function updatePortfolio() {
		try {
			var symbol = $('#symbolLookup').val().toUpperCase();

			if (!symbol.length)
				throw {name:"Note", message:"Please enter a valid stock symbol"}; 

			$('#stockList li h2.stockName').each(function(index) {
				var name = $(this).text().toUpperCase();
				if (name == symbol)
					throw {name:"Note", message:"Can't add symbol: the symbol is already in the portfolio"};
			});

			// Use AJAX to get a clean stock quote
			getQuote(symbol);
		} catch(e) {
			console.log(e.name +': '+ e.message);
		}
	}

	$('#lookupForm').submit(function(event) {
		// trap form submissions - force use to use button to add symbol
		return false;
	});

	$('#addSymbol').click(function(event) {
		updatePortfolio();
		$('#symbolLookup').val('');
		event.preventDefault();
	});

	$('#updatePortfolio').click(function(event) {
		return false;
	});

	$('#stockList').on('click', 'h2.stockName', function() {
		var symbol = $(this).text();
		selectStockItem($(this).parent(), symbol);
	});

	$('#stockList').on('click', 'img.show', function() {
		showRemoveDialog($(this).parent());
	});

	// In the symbol input field, setup the jQuery UI autocomplete feature to 
	// display stocks from the MarkitOnDemand lookup service as the user types.
	$("#symbolLookup").focus().autocomplete({
		source: function(request,response) {
			// Make AJAX request to lookup stock symbols
			new MarkitOnDemand.LookupService(request, function() {
				$("span.help-inline").removeClass('hide');
				//$("span.label-info").empty().hide();
			},
			function(data) {
				response( $.map(data, function(item) {
					return {
						label: item.Name + " (" +item.Exchange+ ")",
						value: item.Symbol
					}
				}));
				$("span.help-inline").addClass('hide');
			});
		}
	});

	// jQuery UI code for tooltips
	$(document).tooltip();
});

