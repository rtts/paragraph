var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var observer = new MutationObserver(update_outline);

window.onload = function() {
    update_outline();
    observer.observe($('#document'), { attributes: true, childList: true, characterData: true, subtree: true });

    document.execCommand("enableObjectResizing", false, false);
    
    $('#logo').addEventListener('click', make_toggler($('#menu')));
};

function insert_note(e) {
    console.log(e);
    console.log('inserting note!');
    document.execCommand("formatBlock", false, 'aside');
}

// returns an event handler that toggles the element
function make_toggler(element) {
    var visible = false;
    element.style.display = 'none';
    element.addEventListener('click', function(e) { e.stopPropagation() });
    return function(e) {
	if (visible) {
	    element.style.display = 'none';
	    visible = false;
	} else {
	    e.stopPropagation();
	    element.style.display = 'block';
	    visible = true;
	    document.addEventListener('click', function(e) {
		element.style.display = 'none';
		visible = false;
		document.removeEventListener('click', arguments.callee);
	    });
	}
    };
};

function update_outline() {
    var old_outline = $('#outline ol');
    var new_outline = create_outline($('#document'));

    if (old_outline) {
	$('#outline').replaceChild(new_outline, old_outline);
    } else {
	$('#outline').appendChild(new_outline);
    }
}

// returns a nested <ol> of the DOM tree beneath element
function create_outline(element) {
    var section = element.firstElementChild;
    var list = document.createElement('ol');
    list.classList.add("tree");
    while (section) {
	var entry = make_entry(section);
	var next_section = section.nextElementSibling;
	if (entry) {
	    list.appendChild(entry);
	    if (section.childElementCount) {
		entry.appendChild(create_outline(section)); // recursion
		if (next_section) {
		    entry.classList.add('branch_open');
		} else {
		    entry.classList.add('branch_open_last');
		}
	    } else {
		if (next_section) {
		    entry.classList.add('leaf');
		} else {
		    entry.classList.add('leaf_last');
		}
	    }
	}
	section = next_section;
    }
    return list;
}

// returns a <li> with a description of the given node
// or null if this node isn't interesting
function make_entry(node) {
    var li   = document.createElement('li')
    var span = document.createElement('span');
        span.setAttribute('draggable', 'true');
    li.appendChild(span);
    switch (node.nodeName) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
	span.textContent = node.textContent;
	break;
    case "P":
	span.textContent = "(paragraph)";
	span.classList.add('paragraph');
	break;
    case "ASIDE":
	return null;
    case "LI":
	return null;
    case "UL":
    case "OL":
	span.textContent = "(list)";
	span.classList.add('paragraph');
	break;
    default:
	span.textContent = node.nodeName;
    }
    return li;
}

// poor man's jquery...
function $(query) {
    return document.querySelector(query);
}

function $$(query) {
    return document.querySelectorAll(query);
}