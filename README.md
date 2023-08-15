# AnnoTize
A General-Purpose Annotation Tool for STEM Documents

## System requirements

* Python3 (3.9 or later)
* A Web Browser with MathML support

The python server requires ```flask```.  
To install all required packages run
```
pip install -r requirements.txt
```

### Using the tool
To use AnnoTize start the main routine by calling:
```
python3 main.py
```
This will start the flask server on port ```5000``` on the
localhost ```127.0.0.1```.  
Navigate to the url using a webbrowser of your choice (tested with Google Chrome and Firefox): http://127.0.0.1:5000/

#### Upload a html and config file
Upload the html file that should be annotated together with the (otional) configuration file.  
Some example files can be found under ```/example```.  
For the html source download the ar5iv paper from: https://ar5iv.labs.arxiv.org/html/1311.5471  
(The examle configuration assumes that the html source file is named: ```1311.5471.html``` and will
set the document uri to ```http://sigmathling.kwarc.info/arxmliv/2020/1311.5471``` and load a declaration tagset)

#### Import / Export annotations
Annotations can be imported and exported from the tools settings menu.

#### Manage ABoSpecs
ABoSpecs can be imported and managed from the settings menu. On startup a number of example ABoSpecs are available.

## License

Copyright 2023 Lukas Panzer

This software is licensed under [the MIT license](./LICENSE).
