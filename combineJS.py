files = [
         'static/js/annotation_body/annotation_body.js',
         'static/js/annotation_body/annotation_creation_body.js',
         'static/js/annotation_body/annotation_highlight_body.js',

         'static/js/annotation_style/base.js',
         'static/js/annotation_style/text.js',
         'static/js/annotation_style/marker.js',
         'static/js/annotation_style/striped_highlight.js',
         'static/js/annotation_style/rectangle.js',
         'static/js/annotation_style/underscore.js',
         'static/js/annotation_style/colored.js',

         'static/js/settings/settings.js',
         'static/js/settings/abstract_tab.js',
         'static/js/settings/general_tab.js',
         'static/js/settings/rapid_mode_tab.js',
         'static/js/settings/style_tab.js',

         'static/js/template_body/abstract_plugin_template.js',
         'static/js/template_body/template.js',

         'static/js/creator.js',
         'static/js/fragment_target.js',
         'static/js/json_parser.js',
         'static/js/xpath_handler.js',
         'static/js/selector.js',
         'static/js/annotation_object.js',
         'static/js/sidebar.js',
         'static/js/menu.js',
         'static/js/custom_select.js',
         'static/js/filter.js',

         'static/color/dist/coloris.min.js',
         'static/anseki-leader-line/leader-line.min.js',

         'static/js/annotator.js',

         'static/js/plugins/simpleTextBody/simple_text_body.js',
         'static/js/plugins/simpleTextBody/template.js',
         'static/js/plugins/simpleTagBody/tag_set.js',
         'static/js/plugins/simpleTagBody/simple_tag_body.js',
         'static/js/plugins/simpleTagBody/template.js',
         'static/js/plugins/identifierBody/identifier_base_body.js',
         'static/js/plugins/identifierBody/identifier_declaration_body.js',
         'static/js/plugins/identifierBody/identifier_occurrence_body.js',
         'static/js/plugins/identifierBody/identifier.js',
         'static/js/plugins/identifierBody/template_base.js',
         'static/js/plugins/identifierBody/template_declaration.js',
         'static/js/plugins/identifierBody/template_occurrence.js',
         'static/js/plugins/groundingBody/grounding_body.js',
         'static/js/plugins/groundingBody/template.js',
         'static/js/plugins/groundingBody/grounding.js',
         'static/js/plugins/quantBody/quant_body.js',
         'static/js/plugins/quantBody/quant.js',
         'static/js/plugins/quantBody/template.js',

         'static/js/plugins/plugin.js',
         'static/js/plugins/simpleTagBody/plugin.js',
         'static/js/plugins/simpleTextBody/plugin.js',
         'static/js/plugins/quantBody/plugin.js',
         'static/js/plugins/identifierBody/plugin.js',
         'static/js/plugins/groundingBody/plugin.js'
        ]


prefix = "(() => {\n \
  if (window.hasRun) {\n \
    return;\n \
  }\n \
  window.hasRun = true;" 

postfix = "})();"

content = ""

content += prefix
for name in files:
    with open(name, 'r') as file:
        content += file.read()
    content += "\n"
content += postfix

with open('bundle.js', 'w') as file:
    file.write(content)

files = [
    'static/css/icons_google.css',
    'static/css/annotator.css',
    'static/css/google.css',
    'static/color/dist/coloris.min.css'
]

content = ""
for name in files:
    with open(name, 'r') as file:
        content += file.read()
    content += "\n"

with open('bundle.css', 'w') as file:
    file.write(content)