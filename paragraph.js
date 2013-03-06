var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

window.onload = function() {
    var observer = new MutationObserver(update_outline);
    observer.observe($('article'), { attributes: true, childList: true, characterData: true, subtree: true });
    update_outline();
    
    bind($('#logo'), $('#menu'),
         function(node) { return node.nodeName == 'A' }, 
         function(node) { return node.nodeName == 'MENU'}
        );
    $('article').contentEditable = 'true';
};

// Given the first button, the first submenu, and tests to determine
// deeper items and submenus, traverses a list structure and sets
// toggling event handlers
function bind(button, submenu, is_button, is_submenu) {
    var item = submenu.firstChild;
    hide(submenu);
    button.addEventListener('click', function() { toglita(submenu) });
    
    // loop over list items
    while (item) {
        if (item.nodeName == 'LI') {
            var next_button = null;
            var next_submenu = null;
            var contents = item.firstChild;
            
            // loop over item contents
            while (contents) {
                if (is_button(contents)) next_button = contents;
                if (is_submenu(contents)) next_submenu = contents;
                contents = contents.nextSibling;
            }
            
            // recurse
            if (next_button && next_submenu) {
                button.addEventListener('click', function() { hide(next_submenu) });
                bind(next_button, next_submenu, is_button, is_submenu);
            }
        }
        item = item.nextSibling;
    }
}

function toglita(el) {
    return el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Returns an event handler that toggles the element
function toggle(element, callback) {
    element.style.display = 'none';
    function flip() {
        unhide(element);
        this.onclick = flop;
        if (callback) callback(true);
    };
    function flop() {
        hide(element);
        this.onclick = flip;
        if (callback) callback(false);
    }
    return flip;
}

function hide(el) {
    el.style.display = 'none';
}
function unhide(el) {
    el.style.display = 'block';
}

// Returns a button that toggles the visibility of the subtree.
function tree_toggler(tree) {
    var img = document.createElement('img');
    img.src = 'closed.gif'; //preload
    img.src = 'open.gif';
    img.className = 'icon';
//    img.addEventListener('click', toggle(tree, function(visible) {
//        img.src = visible ? 'open.gif' : 'closed.gif';
//    }));
    return img;
}

// Returns a button that toggles the visibility of the associated section.
function tree_hider(section) {
    var img = document.createElement('img');
    img.src = 'hidden.png'; //preload
    img.src = 'visible.png';
    img.className = 'icon';
//    img.addEventListener('click', toggle(section.associatedNodes[0], function(visible) {
//        img.src = visible ? 'visible.png' : 'hidden.png';
//    }));
    return img;
}


function printOutline(sections) {
    var ol = document.createElement("ol");
    ol.className = 'outline';
    for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var nextsection = sections[i+1];
        var li = document.createElement("li");
        var title = document.createElement("a");
        
        if(section.heading === null || /^[ \r\n\t]*$/.test(section.heading.text)) {
	    li.className = "h5o-notitle";
	    switch(section.associatedNodes[0].nodeName.toLowerCase()) {
	    case "body": title.textContent = "Document"; break;
	    case "article": title.textContent = "Article"; break;
	    case "aside": title.textContent = "Aside"; break;
	    case "nav": title.textContent = "Navigation"; break;
	    case "section": title.textContent = "Section"; break;
	    default: title.textContent = "Empty title";
	    }
        } else title.textContent = section.heading.text;
        
        var node = section.associatedNodes[0];
        if(node.sectionType !== 1 && node.sectionType !== 2) node = section.heading;
        title.href = "#" + node.id;
        
        title.addEventListener("click", function(event) {
	    event.preventDefault();
	    node.scrollIntoView();
        }, false);

	if (section.childSections.length) {
            var subtree = printOutline(section.childSections);
            li.appendChild(tree_toggler(subtree));
        }

        li.appendChild(tree_hider(section));
        li.appendChild(title);
        if (section.childSections.length) li.appendChild (subtree);
	ol.appendChild(li);

        if (nextsection) {
	    li.classList.add('leaf');
	} else {
	    li.classList.add('leaf_last');
	}
    }
    return ol;
}




// THE FOLLOWING ARE BAD AND HAVE TO GO

function update_outline() {
    HTMLOutline($('article'));
    var old_outline = $('nav ol');
    var new_outline = printOutline($('article').sectionList);
    
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
    list.className = 'outline';
    
    
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

// Poor man's JQuery
function $(query) {
    return document.querySelector(query);
}
