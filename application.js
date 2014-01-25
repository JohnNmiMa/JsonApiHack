var MarkitOnDemand = {}
MarkitOnDemand.quotes = {};

/*
 * Define the Markit On Demand lookup service
 */

/*
 *Define the Markit On Demand quote service
 */

MarkitOnDemand.QuoteService = function(stockSymbol, fCallback) {
	this.symbol = stockSymbol;
    this.fCallback = fCallback;
    this.QUOTE_API = "http://dev.markitondemand.com/Api/v2/Quote/jsonp";
	this.requestQuote();
    //this.requestJsonpQuote(fCallback);
}

/* Ajax success callback. */
MarkitOnDemand.QuoteService.prototype.handleSuccess = function(result) {
    var quote = {
		symbol: result.Symbol,
		name: result.Name,
		price: result.LastPrice,
		change: result.Change,
		changePercent: result.ChangePercent,
		high: result.High,
		low: result.Low,
		cap: result.MarketCap,
		open: result.Open,
		volume: result.Volume
	}
	MarkitOnDemand.quotes[quote.symbol] = quote;
	console.log(MarkitOnDemand.quotes[quote.symbol].name);
    this.fCallback(result);
};

/* Ajax error callback */
MarkitOnDemand.QuoteService.prototype.handleError = function(result) {
    console.error(result);
};

/* Make an ajax request to the Quote API */
MarkitOnDemand.QuoteService.prototype.requestQuote = function() {
    // Abort any open requests
    if (this.xhr) { this.xhr.abort(); }

    // Start a new request
    this.xhr = $.ajax({
        data: { symbol: this.symbol },
        url: this.QUOTE_API,
        dataType: "jsonp",
        success: this.handleSuccess,
        error: this.handleError,
        context: this
    });
};

// Get stock quotes using the getJSON() convenience method
MarkitOnDemand.QuoteService.prototype.requestJsonpQuote = function(fCallback) {
	var jsonpReq = "?symbol=" + this.symbol + "&jsoncallback=?";
	var url = this.QUOTE_API + jsonpReq;
	$.getJSON(url, fCallback);
}

/*
 * Define the Markit On Demand chart service
 */

var Utils = {}
Utils.isNumeric = function(n) {
	  return !isNaN(parseFloat(n)) && isFinite(n);
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

	function addSymbol(symbol) {
		var price = MarkitOnDemand.quotes[symbol].price.toFixed(2);
		var change = MarkitOnDemand.quotes[symbol].change.toFixed(2);
		var changePcnt = MarkitOnDemand.quotes[symbol].changePercent.toFixed(2);
			
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
		var numShares = $(item).find('input');
		$(numShares).change(updateStockValue);
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
	function selectStockItem(stockItem, stockName) {
		var currentlySelectedStock = $('#stockList li.focused');
		var currentlySelectedStockName = '';

		if (currentlySelectedStock.length) {
			$(currentlySelectedStock).removeClass('focused');

			currentlySelectedStockName = $(currentlySelectedStock).find('.stockName').text();
			if (currentlySelectedStockName != stockName) {
				$(stockItem).addClass('focused');
			}
		} else {
			$(stockItem).addClass('focused');
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
		selectStockItem($(this).parent(), $(this).text());
	});

	$('#stockList').on('click', 'img.show', function() {
		var stock = $(this).parent();
		var ans = confirm("Are you sure you want to remove this stock from the portfolio?");
		if (ans==true) {
			$(stock).remove();
			updateTotalValue();
		}
	});

	// jQuery UI code for tooltips
	$(document).tooltip();
});

