// Artem Tyurin, 10.11.2011
// https://github.com/agentcooper

var autocompleteHelper = (function () {
	// create callback storage for 'cather' function to use
	var p = (google.maps.places.Autocomplete.prototype.callback = []);
	
	function is(obj, type) {
		return Object.prototype.toString.call(obj) === '[object ' + type + ']';
	}
	
	// get first value in object, for which condition is true, returns null if not found
	function firstValue(obj, condition) {
		var condition = condition || function() { return true }, found = false;

		for (key in obj) {
			if (condition.call(this, key, obj[key])) {
				found = true; break;
			}
		}
		return found ? obj[key] : null;
	}
	
	// google maps stores private atributes with non constant keys,
	// so next two methods are used to locate what we actually need
	function getInput(el) {
		return firstValue(firstValue(el.gm_bindings_.input), function(key, value) {
			return is(value, 'HTMLInputElement');
		});
	}
	
	function getFullPredictions(el) {
		return firstValue(el, function(key, value) {
			return (key !== 'predictions' && is(value, 'Array') && value.length === 5);
		});
	}
	
	function catcher(key) {
		var inputEl, that = this, i, stringKey;

		for (var stringKey in this) if (typeof this[stringKey] === 'string') break;
		
        if (key == 'predictions' && this[stringKey]) {
			inputEl = getInput(that);
			i = p.length;
			while (i--) {
				if(p[i].el === inputEl) {
					if (p[i].callback.length == 1) {
						p[i].callback.call(that, that.predictions);
					} else {
						setTimeout(function() {
							p[i].callback.call(that, that.predictions, getFullPredictions(that) || []);
						}, 5);
					}
					break;
				}
			}
			//
        }
    }

	// catch changed keys
    google.maps.MVCObject.prototype.changed = catcher;

	// basic usage
	function init(inputEl, callback) {
		p.push({'el': inputEl, 'callback': callback});
		return new google.maps.places.Autocomplete(inputEl, ['geocode']);
	}

	// for jquery ui
	function jInit(id, filter, j) {
		var j = j || jQuery,
			jInput = j('#' + id),
			hiddenInput = j('<input>', {type: 'text'}).insertAfter(jInput).hide(),
			gAuto;

		jInput.autocomplete({'source': []});

		gAuto = init(hiddenInput.get(0), function(predictions) {
			jInput.autocomplete('option', 'source', filter(predictions));
			jInput.autocomplete('search');
		});

		jInput.bind('keyup', function(e) {
			if (j.inArray(e.which, [38, 40, 13, 37, 39]) != -1) {
				e.preventDefault();
			} else {
				gAuto.gm_bindings_.place.b.gm_bindings_.input.b.set('input', jInput.val());
			}
		});
	}

	return {
		init: init,
		jInit: jInit,
		firstValue: firstValue
	}
})();