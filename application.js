var Utils = {}
Utils.isNumeric = function(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
}

Utils.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

$(document).ready(function() {

	// Update the portfolio value field
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

	// Update the field that allows the user to enter how many shares of a stock they own
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

	// Use VEX to present the dialog to remove stocks from the portfolio
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

	// Use VEX to show each stymbols stock information
	function showQuoteDialog() {
		var symbol = $(this).parent().find('.stockName').text();
		var quote = MarkitOnDemand.quotes[symbol];
		var change = parseFloat(quote.Change);
		var className = change>0 ? 'quoteDialog' : 'quoteDialog loss';
		vex.open({
			contentClassName: className,
			content: 
				'<h4 class="quoteName">'             +quote.Name+   '</h3>' +
				'<h5 class="quoteInfo">Last Price: ' +quote.LastPrice+  '</h5>' +
				'<h5 class="quoteInfo">Open: '       +quote.Open+   '</h5>' +
				'<h5 class="quoteInfo">High: '       +quote.High+   '</h5>' +
				'<h5 class="quoteInfo">Low: '        +quote.Low+    '</h5>' +
				'<h5 class="quoteInfo">Change: '     +quote.Change.toFixed(2)+' ('
												     +quote.ChangePercent.toFixed(2)+ '%)</h5>' +
				'<h5 class="quoteInfo">Volume: '     +Utils.numberWithCommas(quote.Volume)+ '</h5>',
			overlayClassName:'quoteDialogOverlay',
			showCloseButton:false});
	}

	// Use VEX to show the application instructions
	function showInfoDialog() {
		vex.open({
			contentClassName: 'infoDialog',
			content: 
				'<h2>Usage</h2>' +
				'<ul class="instructions">' +
				'<li><p>Type in the stock input field to lookup stock symbols.</p></li>' +
				'<li><p>Click on the "Add to Portfolio" button to add the stock to the portfolio.</p></li>' +
				'<li><p>Click in the "price" or "price change" field to see more stock information.</p></li>' +
				'<li><p>Click in stocks\' "# shares" field to show shares owned.</p></li>' +
				'<li><p>Click left of the stock symbol to remove that stock from the portfolio.</p></li>' +
				'<li><p>Click on the stock symbol to show the stock\'s chart.</p></li>' +
				'<li><p>Unclick on the stock symbol to remove the stock\'s chart.</p></li>' +
				'<li><p>Click on the "Update Portfolio" button to update the sock prices and values during trading periods.</p></li>',
			overlayClassName:'infoDialogOverlay',
			showCloseButton:false});
	}

	function addSymbol(symbol) {
		var price = MarkitOnDemand.quotes[symbol].LastPrice.toFixed(2);
			change = MarkitOnDemand.quotes[symbol].Change.toFixed(2),
			changePcnt = MarkitOnDemand.quotes[symbol].ChangePercent.toFixed(2),
			itemHtml = "",	
			item = "",
			numSharedElem = "", priceElem = "", changeElem = "";

		// Create the stock item
		itemHtml = "<li class='stockItem'>";
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
		item = $(itemHtml).appendTo('#stockList');

		// Add appropriate event handlers to the new list elements
		numSharesElem = $(item).find('input');
		$(numSharesElem).change(updateStockValue);
		priceElem = $(item).find('.stockPrice');
		$(priceElem).click(showQuoteDialog);
		changeElem = $(item).find('.stockChange');
		$(changeElem).click(showQuoteDialog);
	}

	function getQuote(symbol) {
		new MarkitOnDemand.QuoteService(symbol, function(jsonResult) {
			try {
				if (!jsonResult || jsonResult.Message)
					throw new Error(jsonResult.Message);

				//console.log(jsonResult);
				addSymbol(jsonResult.Symbol);
			} catch(e) {
				console.log(e.name +': '+ e.message);
			}
		});
	}

	function updateSymbol(symbol, listItem) {
		var price = MarkitOnDemand.quotes[symbol].LastPrice.toFixed(2),
		    change = MarkitOnDemand.quotes[symbol].Change.toFixed(2);
			changeEle = $(listItem).find('.stockChange');

		$(listItem).find('.stockPrice').text(price);
		if (change >= 0) {
			$(changeEle).text('+'+change);
			$(changeEle).removeClass('loss');
			$(changeEle).addClass('gain');
		}
		else {
			$(changeEle).text(change);
			$(changeEle).removeClass('gain');
			$(changeEle).addClass('loss');
		}
	}

	function updateQuote(symbol) {
		new MarkitOnDemand.QuoteService(symbol, function(jsonResult) {
			var item = '';
			try {
				if (!jsonResult || jsonResult.Message) {
					throw new Error(jsonResult.Message);
				}

				// Find list item with stock symbol jsonResult.Symbol
				item = $("#stockList .stockName").filter(function() {
					return ($(this).text() === jsonResult.Symbol)
				});
				// and update the stock values
				updateSymbol(jsonResult.Symbol, $(item).parent());

				// Update the value of the portfolio by triggering its callback
				$(item).parent().find('input').trigger('change');
			} catch(e) {
				console.log(e.name +': '+ e.message);
			}
		});
	}

	// Just toggle whatever stock is clicked on. If it is off, toggle it on,
	// and unselect the previously selected stock. If it is the same stock
	// that is already selected, unselect it.
	function selectStockItem(stockItem, symbol) {
		var currentlySelectedStock = $('#stockList li.focused');
		var currentlySelectedStockName = '';
		var duration = 3650; // 10 years of chart data

		if (currentlySelectedStock.length) {
			// If there is a currently selected stock, unselect it and remove its chart
			$(currentlySelectedStock).removeClass('focused');
			$('#chartContainer').hide();

			// If the user selected another stock, select the new one and show its chart
			currentlySelectedStockName = $(currentlySelectedStock).find('.stockName').text();
			if (currentlySelectedStockName != symbol) {
				$(stockItem).addClass('focused');
				new MarkitOnDemand.InteractiveChartApi(symbol, duration);
				$('#chartContainer').show();
			}
		} else {
			// Nothing was selected, so let's select it now and show its chart
			$(stockItem).addClass('focused');
			new MarkitOnDemand.InteractiveChartApi(symbol, duration);
			$('#chartContainer').show();
		}
	}

	function addStockToPortfolio() {
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

	function updatePortfolio()
	{
		var symbol = "";

		// Loop through each stock in the portfolio
		$('#stockList .stockItem').each(function() {
			symbol = $(this).find('.stockName').text();
			if (symbol == "") return true; // Strangly, but this will continue to the next iteration

			// Request an update from the stock
			updateQuote(symbol);
		});
	}

	$('#lookupForm').submit(function(event) {
		// Trap form submissions - force user to use button to add symbol
		return false;
	});

	$('#addSymbol').click(function(event) { // The add button
		addStockToPortfolio();
		$('#symbolLookup').val('');
		event.preventDefault();
	});

	$('#updatePortfolio').click(updatePortfolio); // The update button

	$('#stockList').on('click', 'h2.stockName', function() { // Selecting a stock will show its chart
		var symbol = $(this).text();
		selectStockItem($(this).parent(), symbol);
	});

	$('#stockList').on('click', 'img.show', function() { // Clicking the trash can to delete a stock
		//$('#chartContainer').hide();
		showRemoveDialog($(this).parent());
	});

	$('#info').click(function() {
		showInfoDialog();
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

	$('#chartContainer').hide();

	// jQuery UI code for tooltips
	$(document).tooltip();
});

