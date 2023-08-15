class CustomSelect {

  constructor() {

  }

  static setValueWithoutEvent(select, value) {
    let list;
    if (!select.matches('.custom-select')) {
      console.warn('Not a custom select', select);
      return;
    }
    list = select.getElementsByClassName('select-item-entry');
    for (let elem of list) {
      elem.classList.remove('same-as-selected');
      if (elem.firstChild.getAttribute('value') === value) {
        elem.classList.add('same-as-selected');
        select.firstChild.innerHTML = elem.innerHTML;
      }
    }
  }

  static getCustomSelect(optionList, defaultValue) {
    let customSelect, defaultWrapper, i, ll, a, b, c;
    
    customSelect = document.createElement("DIV");
    customSelect.setAttribute("class", "custom-select");
    customSelect.style.width = "200px";
    /* create a new DIV that will act as the selected item: */
    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");
    defaultWrapper = document.createElement("DIV");
    if (defaultValue) {
      defaultWrapper.style.color = "gray";
      defaultWrapper.textContent = defaultValue;
    } else {
      defaultWrapper.appendChild(optionList[0].cloneNode(true));
    }
    
    a.appendChild(defaultWrapper);
    customSelect.appendChild(a);
    /* create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");

    ll = optionList.length
    for (i = 0; i < ll; i++) {
      /* for each option create a new DIV that will act as an option item: */
      c = document.createElement("DIV");
      c.setAttribute("class", "select-item-entry");
      if (!defaultValue && i == 0) {
        c.classList.add('same-as-selected');
      }
      c.appendChild(optionList[i].cloneNode(true));
      //c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", function(e) {
        /* when an item is clicked, update the selected item: */
        let y, k, h, yl, change;
  
        h = this.parentNode.previousSibling;
        h.innerHTML = this.innerHTML;
        h.setAttribute('value', this.firstChild.getAttribute('value'));
        y = this.parentNode.getElementsByClassName("same-as-selected");
        yl = y.length;
        change = true;
        for (k = 0; k < yl; k++) {
          if (y[k].isSameNode(this) && y[k].matches(".same-as-selected")) {
            change = false;
          }
          y[k].classList.remove("same-as-selected");
        }
        if (change) {
          // Create a new 'change' event
          var event = new Event('change');

          // Dispatch it.
          customSelect.dispatchEvent(event);
        }
        this.classList.add("class", "same-as-selected");
        h.click();
      });
      b.appendChild(c);
    }
    customSelect.appendChild(b);
    a.addEventListener("click", function(e) {
      /* when the select box is clicked, close any other select boxes,
      and open/close the current select box: */
      e.stopPropagation();
      closeAllSelect(this);
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
    });
    
    return customSelect;
  }
}



function closeAllSelect(elmnt) {
  /*a function that will close all select boxes in the document,
  except the current select box:*/
  var x, y, i, xl, yl, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  xl = x.length;
  yl = y.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
}
/*if the user clicks anywhere outside the select box,
then close all select boxes:*/
document.addEventListener("click", closeAllSelect);