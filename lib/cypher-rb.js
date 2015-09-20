
var RB = {
  //cypherEndpoint : "https://intern.innoq.com/glasnost/cypher",
  cypherEndpoint : "http://localhost:7474/db/data/transaction/commit",
  cypher : function(handler, query, params) {
    if (params) {
      for(var field in params) {
        console.log("Must replace: " + field);
        query = query.split('@' + field).join('\'' + params[field] + '\'');
        query = query.split('#' + field).join( params[field] );
      }   
    }
    console.log("Performing query: " + query);
    var req = JSON.stringify( {
      "statements" : [ {
        "statement" : query
      } ]
    });
    jQuery.ajax({
        type: "POST",
        url: RB.cypherEndpoint,
        data: req,
        success: handler,
        dataType: 'json',
        contentType: 'application/json'
    });
  },
  cypherMapped : function(handler, query, params) {
    RB.cypher(RB.cypherResultMapper(handler), query, params);
  },
  cypherResultMapper : function(handler) {
    return function(cypherResult) {
      RB.assertCypherResult(cypherResult);
      var results = cypherResult.results[0];
      var columns = results.columns;
      var data = results.data;
      var records = [];   
      for (var i = 0; i < data.length; i++) {
        var row = data[i].row;
        var record = {};
        for (var c = 0; c < columns.length; c++) {
          record[columns[c]]=row[c];
        }
        records.push(record);
      }
      handler(records);
    };
  },
  assertCypherResult : function(cypherResult) {
    if (cypherResult.errors && cypherResult.errors.length > 0) {
      throw "Got cypher error: " + JSON.stringify(cypherResult.errors);
    } else if (!cypherResult.results || cypherResult.results.length != 1) {
      throw "Expected result with exactly 1 entry but got " + cypherResult.results.length;
    }
  },
  bindForm : function(form, data) {
    $(form).find('input, select').each(function(n, field) {
      var name = $(field).attr('name');
      if (data[name]) {
        $(field).attr('value', data[name]);
      }
    });
  },
  fillTable : function(table, pQuery, pParams) {
    $(table).empty();
    var query = pQuery || $(table).data('query');
    var params = pParams || $(table).data('params');
    RB.cypher(function(cypherResult) { 
      RB.assertCypherResult(cypherResult);
      var result = cypherResult.results[0];
      var columns = result.columns;
      var data = result.data;
      var headers = d3.select(table).append('thead').append('tr').selectAll('th').data(columns);
      headers.enter().append('th');
      headers.append("th").html(function (d) { return d; });  
  
      var rows = d3.select(table).append('tbody').selectAll('tr').data(data);
      rows.enter().append('tr');
      var cells = rows.selectAll("td").data(function(d) { return d.row; });
      cells.enter().append("td");
      cells.html(function (d) {return d;});   
    }, query, params);  
  },
  isFunction : function(f) {
   var getType = {};
   return f && getType.toString.call(f) === '[object Function]';
  },
  makeExecutor : function(button) {
    $(button).click(function(e) {
      var form = $(button).closest('form');
      if (!form || form.length === 0) {
        throw "Inline submit button " + button + " must be placed inside form.";
      }
      var query = $(button).data('exec');
      var successHandler = $(button).data('onsuccess');
      form.find('input, select').each(function(n, field) {
        console.log("Must replace: " + field.name);
        query = query.replace('@' + field.name, '\'' + field.value + '\'');
        query = query.replace('#' + field.name, field.value );
      });      
      RB.cypher(function(result) {
        RB.assertCypherResult(result);
        if (successHandler) {
          console.log('Calling success handler: ' + successHandler);
          if (RB.isFunction(window[successHandler])) {
            window[successHandler]();
          } else {
            eval(successHandler);
          }
        }
      }, query);
      return false;
    });
  },
  makeAutoComplete : function(input) {
    var query = $(input).data('query');
    if (query) {
      $(input).autocomplete( {
        source: RB.search(query)
      });        
    } else {
      var source = $(input).data('source');
      $(input).autocomplete( {
        source: eval(source)
      });
    }
  },
  flashMessage : function(container, msg, pStatus) {
    var status = pStatus || 'info';    
    var html = '<div class="alert alert-' + status + ' alert-dismissible" role="alert"><strong>' + msg + '</strong>' +
               '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
      $(container).empty().prepend(html);
  },
  search : function(query) {
    return function(request, response) {
      RB.cypherMapped(function(result) {
        response(result);
      }, query, { term : request.term.toLowerCase() + '.*' } );
    }; 
  }
};

$(document).ready(function() {
  $("table.cypher-table").each(function(n, t) {
    RB.fillTable(t);
  });
  $("button.inline-submit").each(function(n, b) {
    RB.makeExecutor(b);
  });  
  $("input.rb-suggest").each(function(n, b) {
    RB.makeAutoComplete(b);
  });
});
