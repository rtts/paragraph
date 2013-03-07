var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

var new_article;
window.onload = function() {
    var observer = new MutationObserver(update_outline);
    observer.observe($('article'), { attributes: true, childList: true, characterData: true, subtree: true });
    update_outline();
    
    // Ideetje om te converteren:
    // 0. begin bij een sectie
    // 1. maak een <section>
    // 2. loop over de kinderen van <article>
    //    a. als kind.associatedSection == sectie
    //       - voeg dan een kloon toe aan <section>
    //    b. anders, doe hetzelfde maar dan voor kind.associatedSection

    $('article').contentEditable = 'true';
    
    // Make the logo toggle the menu
    $('#logo').addEventListener('click', toggle_all(false, $('#menu'), function(node) {
        return node.id == 'menu' || node.className == 'submenu';
    }));

    // Walk the menu and bind all nested buttons
    walk($('#menu'), function(node) {
        if (node.className == "expands") {
            var submenu = node.nextElementSibling;
            node.addEventListener('click', toggle_all(false, submenu, function(node) {
                return node.className == "submenu";
            }));
        }
    });
};

// Returns an event handler that toggles an element and its subtrees
function toggle_all(initial_state, el, is_subtree) {
    initial_state || hide(el);
    return function(e) {
        if (hidden(el)) {
            unhide(el);
        } else {
            walk(el, function(node) {
                if (is_subtree(node) && !hidden(node)) {
                    hide(node);
                }
            });
        }
    };
}
function hide(el) {
    el.style.display = 'none';
}
function unhide(el) {
    el.style.display = 'block';
}
function hidden(el) {
    return el.style.display == 'none';
}

// Returns a button that toggles the visibility of the subtree.
function tree_toggler(tree) {
    var img = document.createElement('img');
    img.src = 'closed.gif'; //preload
    img.src = 'open.gif';
    img.className = 'icon';
    img.addEventListener('click', function(e) {
        if (hidden(tree)) {
            unhide(tree);
            img.src = 'open.gif';
        } else {
            hide(tree);
            img.src = 'closed.gif';
        }});
    return img;
}

// Returns a button that toggles the visibility of the associated section.
function tree_hider(section) {
    var img = document.createElement('img');
    var docnode = section.associatedNodes[0];
    img.src = 'hidden.gif'; //preload
    if (!hidden(docnode)) img.src = 'visible.gif';
    img.className = 'icon';
    img.addEventListener('click', function(e) {
        if (hidden(docnode)) {
            unhide(docnode);
            this.src = 'visible.gif';
        } else {
            hide(docnode);
            this.src = 'hidden.gif';
        }
    });
    return img;
}

function is_section(node) {
    switch (node.nodeName) {
    case "ARTICLE": case "ASIDE": case "NAV": case "SECTION": return true;
    default: return false;
    }
}

// THE FOLLOWING ARE BAD AND HAVE TO GO

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

        //var hider = tree_hider(section);
        //hider.style.float = 'right';
        //li.appendChild(hider);

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

// Walks a DOM tree, calling enter() and exit() for each node. Taken from
// http://www.w3.org/html/wg/drafts/html/master/sections.html#outlines
function walk(root, enter, exit) {
    var node = root;
    start: while (node) {
        if (enter) enter(node);
        if (node.firstElementChild) {
            node = node.firstElementChild;
            continue start;
        }
        while (node) {
            if (exit) exit(node);
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

// Poor man's JQuery
function $(query) {
    return document.querySelector(query);
}
