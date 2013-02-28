var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

window.onload = function() {
    var observer = new MutationObserver(update_outline);
    observer.observe($('article'), { attributes: true, childList: true, characterData: true, subtree: true });
    update_outline();

    document.execCommand("enableObjectResizing", false, false);
    
    $('#logo').addEventListener('click', make_toggler($('#menu')));
    $('#file').addEventListener('click', make_toggler($('#file_menu')));
      $('#import').addEventListener('click', make_toggler($('#import_menu')));
      $('#export').addEventListener('click', make_toggler($('#export_menu')));
    $('#edit').addEventListener('click', make_toggler($('#edit_menu')));
      $('#list').addEventListener('click', make_toggler($('#list_menu')));
    $('#insert').addEventListener('click', make_toggler($('#insert_menu')));
    $('#view').addEventListener('click', make_toggler($('#view_menu')));
    $('#settings').addEventListener('click', make_toggler($('#settings_menu')));
};

// Extra array feature that is used by outline()
Array.prototype.last = function() {
    return this[this.length - 1];
}

/*
                document
document        +--section
+--h1              +--h1
+--p      ===>     +--p
+--h2              +--section
+--p                  +--h2
                      +--p
*/

// Implementation of the outlining algorithm described in http://dev.w3.org/html5/spec/
function outline(node) {

    var current_outline_target = null;
    var current_section = null;
    var stack = [];

    function visit(enter, node) {
        var exit = !enter;

        // When exiting an element, if that element is the element at
        // the top of the stack
        if (exit && stack.last() == node) {
            // Pop that element from the stack.
            stack.pop();
        }

        // If the top of the stack is a heading content element or an
        // element with a hidden attribute
        else if (is_heading(stack.last()) || ignore(stack.last())) {
            // Do nothing.
        }

        // When entering an element with a hidden attribute
        else if (enter && ignore(node)) {
            // Push the element being entered onto the stack.
            stack.push(node);
        }

        // When entering a sectioning content element or a sectioning root element
        else if (enter && is_section(node) || is_root(node)) {
            // If current outline target is not null, and the current
            // section has no heading, create an implied heading and
            // let that be the heading for the current section.
            if ((current_outline_target != null) && "I Give up") {
                var implied_heading = "(paragraph)";
            }

            // If current outline target is not null, push current
            // outline target onto the stack.

            // Let current outline target be the element that is being
            // entered.

            // Let current section be a newly created section for the
            // current outline target element.

            // Associate current outline target with current section.

            // Let there be a new outline for the new current outline
            // target, initialized with just the new current section
            // as the only section in the outline.
        }

        // When exiting a sectioning content element, if the stack is not empty
        else if (exit && stack && is_section(node)) {
            // If the current section has no heading, create an
            // implied heading and let that be the heading for the
            // current section.

            // Pop the top element from the stack, and let the current
            // outline target be that element.

            // Let current section be the last section in the outline of the
            // current outline target element.

            // Append the outline of the sectioning content element
            // being exited to the current section. (This does not
            // change which section is the last section in the
            // outline.)
        }

        // When exiting a sectioning root element, if the stack is not empty
        else if (exit && stack && is_root(node)){

            // If the current section has no heading, create an
            // implied heading and let that be the heading for the
            // current section.

            // Pop the top element from the stack, and let the current
            // outline target be that element.

            // Let current section be the last section in the outline
            // of the current outline target element.

            // Finding the deepest child: If current section has no
            // child sections, stop these steps.

            // Let current section be the last child section of the
            // current current section.

            // Go back to the substep labeled finding the deepest
            // child.
        }
        
        // When exiting a sectioning content element or a sectioning root element
        if (exit && is_section(node) || is_root(node)) {

            // Note: The current outline target is the element being exited,
            // and it is the sectioning content element or a
            // sectioning root element at the root of the subtree for
            // which an outline is being generated.

            // If the current section has no heading, create an
            // implied heading and let that be the heading for the
            // current section.

            // Skip to the next step in the overall set of steps. (The walk is over.)
        }

        // When entering a heading content element
        else if (enter && is_heading(node)) {

            // If the current section has no heading, let the element
            // being entered be the heading for the current section.

            // Otherwise, if the element being entered has a rank
            // equal to or higher than the heading of the last section
            // of the outline of the current outline target, or if the
            // heading of the last section of the outline of the
            // current outline target is an implied heading, then
            // create a new section and append it to the outline of
            // the current outline target element, so that this new
            // section is the new last section of that outline. Let
            // current section be that new section. Let the element
            // being entered be the new heading for the current
            // section.

            // Otherwise, run these substeps:

            // Let candidate section be current section.

            // Heading loop: If the element being entered has a rank
            // lower than the rank of the heading of the candidate
            // section, then create a new section, and append it to
            // candidate section. (This does not change which section
            // is the last section in the outline.) Let current
            // section be this new section. Let the element being
            // entered be the new heading for the current
            // section. Abort these substeps.

            // Let new candidate section be the section that contains
            // candidate section in the outline of current outline target.

            // Let candidate section be new candidate section.

            // Return to the step labeled heading loop.

            // Push the element being entered onto the stack. (This
            // causes the algorithm to skip any descendants of the
            // element.)
        }
    }
}

function walk(root, visit) {
    var node = root;
    start: while (node) {
        visit(true, node);
        if (node.firstElementChild) {
            node = node.firstElementChild;
            continue start;
        }
        while (node) {
            visit(false, node);
            if (node == root) {
                node = null;
            } else if (node.nextElementSibling) {
                node = node.nextElementSibling;
                continue start;
            } else {
                node = node.parentNode;
            }
        }
    }
}



// returns the structure of the tree beneath node
function create_structure(node) {
    var outline;
    var section = node.firstElementChild;
    while (section) {
        if (is_heading(child)) {
            var entry;
            entry.name = node.textContent;
            entry.node = node;
        }

	if (section.childElementCount) {
	    create_outline(section); // recurse!
	}
	var next_section = section.nextElementSibling;
	section = next_section;
    }
}


function is_heading(node) {
    switch (node.nodeName) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
        return true
    default:
        return false
    }
}






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
    var old_outline = $('nav ol');
    var new_outline = create_outline($('article'));

    if (old_outline) {
	$('nav').replaceChild(new_outline, old_outline);
    } else {
	$('nav').appendChild(new_outline);
    }
}

// returns a nested <ol> of the DOM tree beneath element
function create_outline(element) {
    var section = element.firstElementChild;
    var list = document.createElement('ol');
    list.classList.add("outline");
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