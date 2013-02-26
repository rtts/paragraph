var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var observer = new MutationObserver(update_outline);

window.onload = function() {
    update_outline();
    observer.observe($('#document'), { attributes: true, childList: true, characterData: true, subtree: true });
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
	list.appendChild(entry);
	var next_section = section.nextElementSibling;
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
	section = next_section;
    }
    return list;
}

// returns a <li> with a description of the given node
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
	span.textContent = "[paragraph]";
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
