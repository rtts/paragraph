var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

window.onload = function() {
    var observer = new MutationObserver(update_outline);
    observer.observe($('article'), { attributes: true, childList: true, characterData: true, subtree: true });
    update_outline();
                     
    menu($('#logo'), $('#menu'));
    menu($('#file'), $('#file_menu'));
    menu($('#import'), $('#import_menu'));
    menu($('#export'), $('#export_menu'));
    menu($('#edit'), $('#edit_menu'));
    menu($('#list'), $('#list_menu'));
    menu($('#insert'), $('#insert_menu'));
    menu($('#view'), $('#view_menu'));
    menu($('#settings'), $('#settings_menu'));
    
    $('article').contentEditable = 'true';
};

function menu(item, submenu) {
    item.addEventListener('click', menu_toggler(submenu));
}

// Returns an event handler that toggles the element
function menu_toggler(element) {
    element.style.display = 'none';
    function flip(e) {
        console.log("Now showing: " + element.id);
        unhide(element);
        this.removeEventListener('click', flip);
        this.addEventListener('click', flop);
    };
    function flop(e) {
        console.log("Now hiding: " + element.id);
        hide(element);
        this.removeEventListener('click', flop);
        this.addEventListener('click', flip);
    }
    return flip;
}

function hide(el) {
    el.style.display = 'none';
}
function unhide(el) {
    el.style.display = 'block';
}

// Returns an event handler that toggles the element and calls back
// for more instructions. 
function toggle(element, callback, initial_state) {
    var visible = initial_state !== false;
    if (!visible) element.style.display = 'none';
    return function(event) {
        element.style.display = visible ? 'none' : 'block';
        visible = !visible;
        callback(visible, event);
    };
}

// Returns a button that toggles the visibility of the subtree.
function tree_toggler(tree) {
    var img = document.createElement('img');
    img.src = 'closed.gif'; //preload
    img.src = 'open.gif';
    img.className = 'icon';
    img.addEventListener('click', toggle(tree, function(visible) {
        img.src = visible ? 'open.gif' : 'closed.gif';
    }));
    return img;
}

// Returns a button that toggles the visibility of the associated section.
function tree_hider(section) {
    var img = document.createElement('img');
    img.src = 'hidden.png'; //preload
    img.src = 'visible.png';
    img.className = 'icon';
    img.addEventListener('click', toggle(section.associatedNodes[0], function(visible) {
        img.src = visible ? 'visible.png' : 'hidden.png';
    }));
    return img;
}


function printOutline(sections) {
    var ol = document.createElement("ol");
    ol.className = 'outline';
    for(var i in sections) {
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
