class IndexView {
  #documents;
  #documentFileNames;
  #runtimes;
  #TEIConverter;

  #configuration;

  constructor() {
    this.#documents = [];
    this.#documentFileNames = [];
    this.#runtimes = [];
    this.#TEIConverter = new CETEI();
    document.body.style.backgroundColor = "#b3c6f0";
    // init functions
    this.#init();
    // position the second div
    this.#positionSelectionDiv();
  }

  #init() {
    // initialize file upload
    let counter = 0;
    let uploadButton = document.getElementById("upload-button");
    let container = document.querySelector(".root-container");
    let error = document.getElementById("error");
    let preview = document.getElementById("preview");
    let confirm = document.getElementById("confirm-upload");
    let configUpload = document.getElementById("root-configuration");
    let configButton = document.getElementById("config-button");
    let configName = document.getElementById("root-config-name");
    error.innerText = "";
    confirm.disabled = true;

    /* --------------- handle html upload (+ config) -------------- */

    const fileHandler = (file, name, type) => {
      if (type !== "text/html" && type !== "application/json" && type !== "text/xml") {
        //File Type Error
        error.innerText = "Please upload a html (or xml) file";
        return false;
      }
      if (type === "application/json") {
        configFileHandler(file, name, type);
        return;
      }
      // reset error
      error.innerText = "";
      // load file
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onloadend = () => {
        if (type === "text/html") {
          // save the html content of the loaded file
          const doc = document.createElement('html');
          doc.innerHTML = reader.result;
          const body = doc.getElementsByTagName('body')[0];
          if (!body) {
            console.error('No body tag in html document found...');
            error.innerText = "Please upload a html file";
            return false;
          }
          body.dataset.doctype = "html";
          this.#documents.push(body);
        } else {
          let body;
          body = document.createElement('body');
          body.dataset.doctype = "xml";
          this.#TEIConverter.makeHTML5(reader.result, (data) => {
            data.style.marginLeft = "25px";
            body.appendChild(data);
            this.#documents.push(body);
          });
        }
        
        // save file name
        this.#documentFileNames.push(name);
        // show the name of the loaded file to the user
        const span = document.createElement('span');
        span.textContent = name;
        span.style.display = "block";
        preview.appendChild(span);
        // enable confirm button
        confirm.disabled = false;
        this.#positionSelectionDiv();
      };
    };

    const reset = () => {
      // reset file names
      preview.innerHTML = "";
      // reset loaded documents
      this.#documents = [];
      this.#documentFileNames = [];
      // disable confirm button + reset
      confirm.disabled = true;
      this.#positionSelectionDiv();
      
    }
  
    //Upload Button
    uploadButton.addEventListener("change", () => {
      reset();
      Array.from(uploadButton.files).forEach((file) => {
        fileHandler(file, file.name, file.type);
      });
    });
  
    container.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      counter++;
      container.classList.add("active");
    }, false);
  
    container.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      counter--;
      if (counter === 0) {
        container.classList.remove("active");
      }
    }, false);
  
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      container.classList.add("active");
    }, false);

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      counter = 0;
      container.classList.remove("active");
      let draggedData = e.dataTransfer;
      let files = draggedData.files;
      reset();
      Array.from(files).forEach((file) => {
        fileHandler(file, file.name, file.type);
      });
    }, false);

    /* --------------- handle config upload -------------- */
    // remap button to input button
    configButton.addEventListener("click", event => configUpload.click());
    
    const configFileHandler = (file, name, type) => {
      if (type !== "application/json") {
        //File Type Error
        configName.style.color = "red";
        configName.textContent = "Please upload a json file";
        return false;
      }
      // preview name of file
      configName.style.removeProperty("color");
      configName.textContent = name;
      // parse file content
      let reader = new FileReader();
      reader.readAsText(file);
      reader.onloadend = () => {
        // save the content of file
        this.#configuration = JSON.parse(reader.result);
      };
    };
  
    //Upload Button
    configUpload.addEventListener("change", () => {
      Array.from(configUpload.files).forEach((file) => {
        configFileHandler(file, file.name, file.type);
      });
    });

    /* --------------- confirm upload -------------- */

    confirm.addEventListener("click", event => this.#confirm());
  }

  #positionSelectionDiv() {
    let div1, div2;
    div1 = document.getElementsByClassName('root-container')[0];
    div2 = document.getElementsByClassName('root-selection')[0];

    const rect = div1.getBoundingClientRect();
    console.log(div1.offsetTop,div1.offsetHeight );
    const height = div1.offsetHeight;
    div2.style.top = rect.top + height + 25 + "px";
  }  

  #refineDocumentBody(base, vals) {
    if (!base.children) {
        return;
    }
    for (let ch of base.children) {
      let match = false;
      for (let val of vals) {
        let id = "#" + val;
        if (ch.matches(id)) {
          match = true;
          break;
        }
      }
      if (match) {
        // child is one of defined vals
        continue;
      }
      for (let val of vals) {
        let id = "#" + val;
        if (ch.querySelector(id)) {
          match = true;
          break;
        }
      }
      if (match) {
        // recursive call to children
        this.#refineDocumentBody(ch, vals);
      } else {
        // child does not match any val
        ch.style.display = 'none';
      }
    }
  }

  #parseConfiguration() {
    if (!this.#configuration) {
      return;
    }
    let config = Parser.parseConfiguration(this.#configuration);
    if (config.config) {
      settingsPlugin.options.creator = config.config.creator;
    }
    if (config.tags) {
      for (let elem of config.tags) {
        tagSetPlugin.importFromJSON(elem);
      }
    }
    if (config.concepts) {
      conceptPlugin.removeAllConcepts();
      for (let concept of config.concepts.concepts) {
        conceptPlugin.addConcept(concept, true);
      }
    }
    return config;
  }

  #createRuntimes(config) {
    const nrDocs = this.#documents.length;
    for (let i = 0; i < nrDocs; ++i) {
      let runtimeConfig, teiConv;
      if (config) {
        runtimeConfig = config.files.get(this.#documentFileNames[i]);
        teiConv = config.conversion.get(runtimeConfig.id)
      }

      let newRuntime = new AnnotationRuntime(window.location.href, false, runtimeConfig, teiConv);
      if (nrDocs > 1) {
        newRuntime.sidebar.addDocumentNavigator(i + 1, nrDocs);
      }
      this.#runtimes.push(newRuntime);
    }
  }

  #initializeDocumentBodys(config) {
    const nrDocs = this.#documents.length;
    for (let i = 0; i < nrDocs; ++i) {
      let conf;
      if (config) {
        conf = config.files.get(this.#documentFileNames[i]);
      }
      if (conf && conf.refinedBy) {
        if (conf.refinedBy.type !== "Sections") {
          console.error("Unknown refine type for document: ", conf.refinedBy.type);
          continue;
        }
        this.#refineDocumentBody(this.#documents[i], conf.refinedBy.vals);
      }
    }
  }
  
  #loadDocumentIntoBody(body) {
    // load new body
    document.body.style.removeProperty('background-color');
    let colorPicker = document.getElementById('clr-picker');
    document.body.replaceWith(body);
    if (colorPicker) {
      document.body.appendChild(colorPicker);
    }
  }

  #loadRuntime(number) {
    // setup runtime
    runtime = this.#runtimes[number-1];
    runtime.activate();
    /*
    window.onresize = (event) => {
      document.body.style.removeProperty('width');
      document.body.style.width = document.body.clientWidth - 425 + 'px';
    }
    */
  }

  #confirm() {
    let config;
    config = this.#parseConfiguration();
    this.#createRuntimes(config);
    this.#initializeDocumentBodys(config);
    this.#loadDocumentIntoBody(this.#documents[0]);
    this.#loadRuntime(1);
  }

  /**
   * Switch the document
   * @param {*} number 
   */
  switchDocument(next) {
    runtime.deactivate();
    // load new document
    this.#loadDocumentIntoBody(this.#documents[next-1]);
    this.#loadRuntime(next);
  }
}

/* Set up color picker */
Coloris({
  el: '.coloris',
  swatches: [
    '#A3B9C9',  // powder blue
    '#EEE3AB',  // vanilla
    '#D9CFC1',  // bone
    '#FFBFB7',  // melon
    '#FFD447',  // mustard
    '#4ECDC4',  // robin egg blue
    '#59F8E8',  // fluorescent cyan
    '#90E0EF',  // non photo blue
    '#8FBC94',  // cambridge blue
    '#C3BF6D',  // citron
    '#DAFFED',  // mint green
    '#FFD4B8'   // apricot
  ]
});

Coloris.setInstance('.instance3', {
  theme: 'pill',
  themeMode: 'dark',
  formatToggle: true
});

const indexView = new IndexView();