var MarkitOnDemand = {}

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


$(document).ready(function() {

	function showQuote() {
		try {
			var symbol = $('input').val();
			if(symbol.length <= 0)
				throw {name:"Note", message:"Please enter a valid stock symbol"};

			new MarkitOnDemand.QuoteService(symbol, function(jsonResult) {
				if (!jsonResult || jsonResult.Message){
					throw new Error(jsonResult.Message);
				}

				console.log(jsonResult);

				// Update the stock quote
				$("h1").first().text(jsonResult.Name);
			});
		} catch(e) {
		} finally {
			return false;
		}
	}

	$('form').submit(showQuote);

	// jQuery UI code for tooltips
	$(document).tooltip();
});

