const default_concepts = [
  {
      "name": "Grounding",
      "description": "My awsome description",
      "rdftype": "???",
      "style": "colored",
      "fields": [
      {
          "type": "select",
          "name": "Grounding",
          "selectId": "default_grounding_select",
          "rdfpred": "???",
          "modifiable": true,
          "validation": "^[A-Za-z]+$",
          "number": {
            "atleast": 1,
            "atmost": 1
          }
      },
      {
          "type": "number",
          "name": "Arity",
          "rdfpred": "???",
          "min": 0,
          "number": {
            "atleast": 1,
            "atmost": 1
          }
      },
      {
          "type": "reference",
          "name": "Sog",
          "rdfpred": "???",
          "referencedTypes": [
            "Source of Grounding"
          ],
          "referenceRole": "target",
          "label": "Sog",
          "number": {
            "atleast": 0,
            "atmost": "inf"
          }
      }
      ]
  },
  {
      "name": "QuantBody",
      "description": "My awsome description",
      "rdftype": "???",
      "fields": [
      {
          "type": "number",
          "name": "Scalar",
          "rdfpred": "???",
          "number": {
            "atleast": 1,
            "atmost": 1
          }
      },
      {
          "type": "text",
          "name": "Unit",
          "rdfpred": "???",
          "validation": "^[a-z]+$",
          "number": {
            "atleast": 1,
            "atmost": 1
          }
      }
      ]
  },
  {
    "name": "SimpleTagBody",
    "description": "A simple tag body containing a Tag from a given TagSet",
    "rdftype": "???",
    "fields": [
    {
        "type": "tag",
        "name": "Annotation-Tag",
        "rdfpred": "???",
        "number": {
          "atleast": 1,
          "atmost": 3
        }
    }
    ]
  },
  {
    "name": "Source of Grounding",
    "description": "The source of a grounding annotation",
    "rdftype": "???",
    "fields": [
    {
        "type": "tag",
        "name": "Annotation-Tag",
        "tagId": "https://sigmathling.kwarc.info/resources/grounding-dataset/sog",
        "rdfpred": "???",
        "number": {
          "atleast": 1,
          "atmost": 1
        }
    }
    ]
  },
  {
    "name": "IdentifierDeclaration",
    "description": "The declaration of an identifier",
    "rdftype": "???",
    "fields": [
    {
        "type": "tag",
        "name": "Annotation-Tag",
        "tagSetId": "Declaration-Tag",
        "rdfpred": "???",
        "number": {
          "atleast": 1,
          "atmost": 1
        }
    }
    ]
  },
  {
    "name": "IdentifierOccurrence",
    "description": "The occurrence of an identifier",
    "rdftype": "???",
    "style": "colored",
    "fields": [
    {
      "type": "reference",
      "name": "Identifier",
      "rdfpred": "???",
      "referencedTypes": [
        "IdentifierDeclaration"
      ],
      "referenceRole": "source",
      "label": "Occurrence",
      "number": {
        "atleast": 1,
        "atmost": 1
      }
    }
    ]
  }
]

const highlight_concept = {
  "name": "Highlight",
  "description": "Highlights a text-span that yet has to be annotated",
  "rdftype": "???",
  "fields": [
  {
      "type": "textbox",
      "name": "Notes",
      "rdfpred": "???",
      "number": {
        "atleast": 0,
        "atmost": "Infinity",
        "default": 0
      }
  }
  ]
}

const default_selects = [
  {
    "id": "default_grounding_select",
    "options": [

    ]
  }
]