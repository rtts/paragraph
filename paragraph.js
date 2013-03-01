// poor man's jquery...
function $(query) {
    return document.querySelector(query);
}

function $$(query) {
    return document.querySelectorAll(query);
}
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

// Returns an event handler that toggles the element
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

/*
                document
document        +--section
+--h1              +--h1
+--p      ===>     +--p
+--h2              +--section
+--p                  +--h2
                      +--p
*/

// Walks the elements of a DOM depth-first, calling enter(el) and
// exit(el) when entering/leaving each node. As a premature
// optimization, if enter(el) returns false it will not descend into the
// subtree.
function racewalk(root, enter, exit) {
    var node = root;
    start: while (node) {
        if (enter(node) && node.firstElementChild) {
            // descend!
            node = node.firstElementChild;
            continue start;
        }
        while (node) {
            exit(node);
            if (node == root) {
                return;
            } else if (node.nextElementSibling) {
                // descend again!
                node = node.nextElementSibling;
                continue start;
            } else {
                node = node.parentNode;
            }
        }
    }
}

// A customized implementation of the HTML5 outlining algorithm
// described by http://dev.w3.org/html5/spec/ Also very much inspired
// by https://github.com/hoyois/html5outliner (thanks Marc!)
function HTMLOutline(root) {
    
    // BEGIN OUTLINE ALGORITHM
    // STEP 1
    var currentOutlinee = null; // element whose outline is being created
    // STEP 2
    var currentSection = null; // current section
    
    // STEP 3
    // Minimal stack object
    var stack = {"lastIndex": -1};
    stack.isEmpty = function() {
        return stack.lastIndex === -1;
    };
    stack.push = function(e) {
        stack[++stack.lastIndex] = e;
        stack.top = e;
    };
    stack.pop = function() {
        var e = stack.top;
        delete stack[stack.lastIndex--];
        stack.top = stack[stack.lastIndex];
        return e;
    };
    
    // STEP 4 (minus DOM walk which is at the end)
    function enter(node) {
        if(isElement(node)) {
            if(!stack.isEmpty() && (isHeadingElement(stack.top) || isHidden(stack.top))) {
                // Do nothing
            } else if(isHidden(node)) {
                stack.push(node);
            } else if(isSectioningContentElement(node) || isSectioningRootElement(node)) {
                // if(currentOutlinee !== null && currentSection.heading === null) {
                // Create implied heading
                // }
                if(currentOutlinee !== null) stack.push(currentOutlinee);
                currentOutlinee = node;
                currentSection = new Section();
                associateNodeWithSection(currentOutlinee, currentSection);
                currentOutlinee.appendSection(currentSection);
            } else if(currentOutlinee === null) {
                // Do nothing
            } else if(isHeadingElement(node)) {
                if(currentSection.heading === null) currentSection.heading = node;
                else if(currentOutlinee.lastSection.heading === null || node.rank >= currentOutlinee.lastSection.heading.rank) {
                    currentSection = new Section();
                    currentSection.heading = node;
                    currentOutlinee.appendSection(currentSection);
                } else {
                    var candidateSection = currentSection;
                    do {
                        if(node.rank < candidateSection.heading.rank) {
                            currentSection = new Section();
                            currentSection.heading = node;
                            candidateSection.appendChild(currentSection);
                            break;
                        }
                        var newCandidate = candidateSection.parentSection;
                        candidateSection = newCandidate;
                    } while(true);
                }
                stack.push(node);
            } // else {
            // Do nothing
            // }
        }
    }
    
    function exit(node) {
        if(isElement(node)) {
            if(!stack.isEmpty() && node === stack.top) stack.pop();
            else if(!stack.isEmpty() && (isHeadingElement(stack.top) || isHidden(stack.top))) {
                // Do nothing
            } else if(!stack.isEmpty() && isSectioningContentElement(node)) {
                // if(currentSection.heading === null) {
                // Create implied heading
                // }
                currentOutlinee = stack.pop();
                currentSection = currentOutlinee.lastSection;
                for(var i = 0; i < node.sectionList.length; i++) {
                    currentSection.appendChild(node.sectionList[i]);
                }
            } else if(!stack.isEmpty() && isSectioningRootElement(node)) {
                // if(currentSection.heading === null) {
                // Create implied heading
                // }
                currentOutlinee = stack.pop();
                currentSection = currentOutlinee.lastSection;
                while(currentSection.childSections.length > 0) {
                    currentSection = currentSection.lastChild;
                }
            } else if(isSectioningContentElement(node) || isSectioningRootElement(node)) {
                // if(currentSection.heading === null) {
                // Create implied heading
                // }
                // The algorith says to end the walk here, but that's assuming root is a sectioning element
                // Instead we reset the algorithm for subsequent top-level sectioning elements
                currentOutlinee = null;
                currentSection = null;
            } // else {
            // Do nothing
            // }
        }
        if(node.associatedSection === null && currentSection !== null) associateNodeWithSection(node, currentSection);
    }
    
    // STEP 5
    // The heading associated to node is node.associatedSection.heading, if any
    // END OUTLINE ALGORITHM
    
    // Now we must make the necessary definitions for the above to make sense
    function associateNodeWithSection(node, section) {
        section.associatedNodes.push(node);
        node.associatedSection = section;
    }
    
    function isElement(node) {
        return node.nodeType === 1;
    }
    
    function isHidden(node) {
        return node.hidden;
    }
    
    function isSectioningContentElement(node) {
        return node.sectionType === 1;
    }
    
    function isSectioningRootElement(node) {
        return node.sectionType === 2;
    }
    
    function isHeadingElement(node) {
        return node.rank !== undefined;
    }
    
    function extend(node) {
        if(node.nodeType === 1) {
            switch(node.nodeName.toLowerCase()) {
            case "blockquote": case "body": case "details": case "fieldset": case "figure": case "td":
                extendSectioningRootElement(node);
                break;
            case "article": case "aside": case "nav": case "section":
                extendSectioningContentElement(node);
                break;
            case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
                extendHeadingElement(node);
                break;
            case "hgroup":
                extendHeadingGroupElement(node);
                break;
            default:
                extendNode(node);
            }
        } else extendNode(node);
    }
    
    function extendNode(node) {
        node.associatedSection = null;
    }
    
    function extendSectioningElement(node) {
        extendNode(node);
        node.sectionList = [];
        node.firstSection = null;
        node.lastSection = null;
        
        node.appendSection = function(section) {
            this.sectionList.push(section);
            if(this.firstSection === null) this.firstSection = section;
            this.lastSection = section;
        };
    }
    
    function extendSectioningContentElement(node) {
        extendSectioningElement(node);
        node.sectionType = 1;
    }
    
    function extendSectioningRootElement(node) {
        extendSectioningElement(node);
        node.sectionType = 2;
    }
    
    function extendHeadingContentElement(node) {
        extendNode(node);
        Object.defineProperty(node, "depth", {"get": function() {
            var section = node.associatedSection;
            var depth = 1;
            if(section !== null) {
                while(section = section.parentSection) ++depth;
            }
            return depth;
        }, "configurable": true, "enumerable": true});
    }
    
    function extendHeadingElement(node) {
        extendHeadingContentElement(node);
        node.rank = -parseInt(node.nodeName.charAt(1));
        node.text = node.textContent;
    }
    
    function extendHeadingGroupElement(node) {
        extendHeadingContentElement(node);
        
        for(var i = 1; i <= 6; i++) {
            var h = node.getElementsByTagName("h" + i);
            if(h.length > 0) {
                node.rank = -i;
                node.text = h[0].textContent;
                break;
            }
        }
        
        if(node.rank === undefined) {
            node.rank = -1;
            node.text = "";
        }
    }
    
    // Walk the DOM subtree of root
    var node = root;
    start: while(node) {
        extend(node);
        enter(node);
        if(node.firstChild) {
            node = node.firstChild;
            continue start;
        }
        while(node) {
            exit(node);
            if(node === root) break start;
            if(node.nextSibling) {
                node = node.nextSibling;
                continue start;
            }
            node = node.parentNode;
        }
    }
}



// THE FOLLOWING ARE BAD AND HAVE TO GO

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

