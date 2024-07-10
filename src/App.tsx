import React from "react"

import Dagre from "@dagrejs/dagre"
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import data from "./example.json"

const getParagraphPerLine = (text: string) => {
  const split = text.split("\n")
  return (
    <>
      {split.map((line, lineIndex) => (
        <p key={lineIndex}>{line}</p>
      ))}
    </>
  )
}

interface DocumentationScalarValueType {
  protoType: string
  notes: string
  cppType: string
  csType: string
  goType: string
  javaType: string
  phpType: string
  pythonType: string
  rubyType: string
}

interface DocumentationEnumValue {
  name: string
  number: string
  description: string
}

interface DocumentationEnum {
  name: string
  longName: string
  fullName: string
  description: string
  values: DocumentationEnumValue[]
}

interface DocumentationExtension {
  name: string
  longName: string
  fullName: string
  description: string
  label: string
  type: string
  longType: string
  fullType: string
  number: number
  defaultValue?: string | number | boolean
  containingType: string
  containingLongType: string
  containingFullType: string
}

interface DocumentationValidatorField {
  name: string
  value: string | number | boolean
}

interface DocumentationMessageField {
  name: string
  description: string
  label: string
  type: string
  longType: string
  fullType: string
  ismap: boolean
  isoneof: boolean
  oneofdecl: string
  defaultValue?: string
  options?: {
    deprecated?: boolean
    "validator.field"?: DocumentationValidatorField[]
    "validate.rules"?: DocumentationValidatorField[]
    // TODO: support custom options
  }
}

interface DocumentationMessage {
  name: string
  longName: string
  fullName: string
  description: string
  hasExtensions: boolean
  hasFields: boolean
  hasOneofs: boolean
  extensions: DocumentationExtension[]
  fields: DocumentationMessageField[]
}

interface DocumentationHTTPRule {
  method: string
  pattern: string
  body: string
}

interface DocumentationServiceMethod {
  name: string
  description: string
  requestType: string
  requestLongType: string
  requestFullType: string
  requestStreaming: boolean
  responseType: string
  responseLongType: string
  responseFullType: string
  responseStreaming: boolean
  options?: {
    "google.api.http"?: {
      rules: DocumentationHTTPRule[]
    }
    // TODO: support custom options
  }
}

interface DocumentationService {
  name: string
  longName: string
  fullName: string
  description: string
  methods: DocumentationServiceMethod[]
}

interface DocumentationFile {
  name: string
  description: string
  package: string
  hasEnums: boolean
  hasExtensions: boolean
  hasMessages: boolean
  hasServices: boolean
  messages: DocumentationMessage[]
  enums: DocumentationEnum[]
  extensions: DocumentationExtension[]
  services: DocumentationService[]
}

interface Documentation {
  files: DocumentationFile[]
  scalarValueTypes: DocumentationScalarValueType[]
}

const doc = data as Documentation

const Flow = ({ file }: { file: DocumentationFile }) => {
  const nodes = file.messages.map((message, messageIndex) => ({
    id: message.fullName,
    position: { x: messageIndex * 100, y: messageIndex * 50 },
    data: {
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: 10,
          }}
        >
          <span className="badge">M</span>
          {message.longName}
        </span>
      ),
    },
  }))

  const edges = file.messages.flatMap((message) =>
    message.fields
      .filter((field) =>
        file.messages.some((message) => message.fullName === field.fullType)
      )
      .map((field) => ({
        id: message.fullName + "-" + field.fullType,
        source: message.fullName,
        target: field.fullType,
        animated: false,
      }))
  )

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB" })
  edges.forEach((edge) => g.setEdge(edge.source, edge.target))
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: 200,
      height: 20,
      // width: node.measured?.width ?? 0,
      // height: node.measured?.height ?? 0,
    })
  )

  Dagre.layout(g)

  return (
    <ReactFlow
      colorMode="system"
      nodes={nodes.map((node) => {
        const position = g.node(node.id)
        const x = position.x - 200 / 2
        const y = position.y - 20 / 2

        return { ...node, position: { x, y } }
      })}
      edges={edges}
      edgesReconnectable={false}
      nodesDraggable={false}
      nodesConnectable={false}
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  )
}

const App = () => {
  return (
    <>
      <h1 id="title">Protocol Documentation</h1>

      <h2>Table of Contents</h2>

      <div id="toc-container">
        <ul id="toc">
          {doc.files.map((file, fileIndex) => (
            <li key={fileIndex}>
              <a href={`#${file.name}`}>{file.name}</a>
              <ul>
                {file.messages.map((message, messageIndex) => (
                  <li key={messageIndex}>
                    <a href={`#${message.fullName}`}>
                      <span className="badge">M</span>
                      {message.longName}
                    </a>
                  </li>
                ))}

                {file.enums.map((fEnum, enumIndex) => (
                  <li key={enumIndex}>
                    <a href={`#${fEnum.fullName}`}>
                      <span className="badge">E</span>
                      {fEnum.longName}
                    </a>
                  </li>
                ))}

                {file.hasExtensions && (
                  <li>
                    <a href={`#${file.name}-extensions`}>
                      <span className="badge">X</span>
                      File-level Extensions
                    </a>
                  </li>
                )}

                {file.services.map((service, serviceIndex) => (
                  <li key={serviceIndex}>
                    <a href={`#${service.fullName}`}>
                      <span className="badge">S</span>
                      {service.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}

          <li>
            <a href="#scalar-value-types">Scalar Value Types</a>
          </li>
        </ul>
      </div>

      {doc.files.map((file, fileIndex) => (
        <React.Fragment key={fileIndex}>
          <div className="file-heading">
            <h2 id={file.name}>{file.name}</h2>
            <a href="#title">Top</a>
          </div>
          {getParagraphPerLine(file.description)}

          <div style={{ width: "100%", height: 600 }}>
            <Flow file={file} />
          </div>

          {file.messages.map((message, messageIndex) => (
            <React.Fragment key={messageIndex}>
              <h3 id={message.fullName}>{message.longName}</h3>
              {getParagraphPerLine(message.description)}

              {message.hasFields && (
                <>
                  <table className="field-table">
                    <thead>
                      <tr>
                        <td>Field</td>
                        <td>Type</td>
                        <td>Label</td>
                        <td>Description</td>
                      </tr>
                    </thead>
                    <tbody>
                      {message.fields.map((field, fieldIndex) => (
                        <tr key={fieldIndex}>
                          <td>{field.name}</td>
                          <td>
                            <a href={`$${field.fullType}`}>{field.longType}</a>
                          </td>
                          <td>{field.label}</td>
                          <td>
                            <p>
                              {field.options?.deprecated && (
                                <strong>Deprecated. </strong>
                              )}
                              {field.description}
                              {field.defaultValue &&
                                ` Default: ${field.defaultValue}`}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {message.fields.some(
                    (field) =>
                      field.options?.["validator.field"] ||
                      field.options?.["validate.rules"]
                  ) && (
                    <>
                      <h4>Validated Fields</h4>
                      <table>
                        <thead>
                          <tr>
                            <td>Field</td>
                            <td>Validations</td>
                          </tr>
                        </thead>
                        <tbody>
                          {message.fields
                            .filter(
                              (field) =>
                                field.options?.["validator.field"] ||
                                field.options?.["validate.rules"]
                            )
                            .map((field, fieldIndex) => (
                              <tr key={fieldIndex}>
                                <td>{field.name}</td>
                                <td>
                                  <ul>
                                    {field.options!["validator.field"]?.map(
                                      (rule, ruleIndex) => (
                                        <li key={ruleIndex}>
                                          {rule.name}: {rule.value.toString()}
                                        </li>
                                      )
                                    )}
                                    {field.options?.["validate.rules"]?.map(
                                      (rule, ruleIndex) => (
                                        <li key={ruleIndex}>
                                          {rule.name}: {rule.value.toString()}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}

              {message.hasExtensions && (
                <>
                  <br />
                  <table className="extension-table">
                    <thead>
                      <tr>
                        <td>Extension</td>
                        <td>Type</td>
                        <td>Base</td>
                        <td>Number</td>
                        <td>Description</td>
                      </tr>
                    </thead>
                    <tbody>
                      {message.extensions.map((extension, extensionIndex) => (
                        <tr key={extensionIndex}>
                          <td>{extension.name}</td>
                          <td>
                            <a href={`#${extension.fullType}`}>
                              {extension.longType}
                            </a>
                          </td>
                          <td>
                            <a href={`#${extension.containingLongType}`}>
                              {extension.containingLongType}
                            </a>
                          </td>
                          <td>{extension.number}</td>
                          <td>
                            <p>
                              {extension.description}
                              {extension.defaultValue !== undefined &&
                                ` Default: ${extension.defaultValue}`}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </React.Fragment>
          ))}

          {file.enums.map((fEnum, enumIndex) => (
            <React.Fragment key={enumIndex}>
              <h3 id={fEnum.fullName}>{fEnum.longName}</h3>
              {getParagraphPerLine(fEnum.description)}

              <table className="enum-table">
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Number</td>
                    <td>Description</td>
                  </tr>
                </thead>
                <tbody>
                  {fEnum.values.map((value, valueIndex) => (
                    <tr key={valueIndex}>
                      <td>{value.name}</td>
                      <td>{value.number}</td>
                      <td>
                        <p>{value.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </React.Fragment>
          ))}

          {file.hasExtensions && (
            <>
              <h3 id={`${file.name}-extensions`}>File-level Extensions</h3>
              <table className="extension-table">
                <thead>
                  <tr>
                    <td>Extension</td>
                    <td>Type</td>
                    <td>Base</td>
                    <td>Number</td>
                    <td>Description</td>
                  </tr>
                </thead>
                <tbody>
                  {file.extensions.map((extension, extensionIndex) => (
                    <tr key={extensionIndex}>
                      <td>{extension.name}</td>
                      <td>
                        <a href={`#${extension.fullType}`}>
                          {extension.longType}
                        </a>
                      </td>
                      <td>
                        <a href={`#${extension.containingFullType}`}>
                          {extension.containingLongType}
                        </a>
                      </td>
                      <td>{extension.number}</td>
                      <td>
                        <p>
                          {extension.description}
                          {extension.defaultValue !== undefined &&
                            `Default: ${extension.defaultValue}`}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {file.services.map((service, serviceIndex) => (
            <React.Fragment key={serviceIndex}>
              <h3 id={service.fullName}>{service.name}</h3>
              {getParagraphPerLine(service.description)}
              <table className="enum-table">
                <thead>
                  <tr>
                    <td>Method Name</td>
                    <td>Request Type</td>
                    <td>Response Type</td>
                    <td>Description</td>
                  </tr>
                </thead>
                <tbody>
                  {service.methods.map((method, methodIndex) => (
                    <tr key={methodIndex}>
                      <td>{method.name}</td>
                      <td>
                        <a href={`#${method.requestFullType}`}>
                          {method.requestLongType}
                        </a>
                        {method.requestStreaming && " stream"}
                      </td>
                      <td>
                        <a href={`#${method.responseFullType}`}>
                          {method.responseLongType}
                        </a>
                        {method.responseStreaming && " stream"}
                      </td>
                      <td>
                        <p>{method.description}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {service.methods.some(
                (method) => method.options?.["google.api.http"]
              ) && (
                <>
                  <h4>Methods with HTTP bindings</h4>
                  <table>
                    <thead>
                      <tr>
                        <td>Method Name</td>
                        <td>Method</td>
                        <td>Pattern</td>
                        <td>Body</td>
                      </tr>
                    </thead>
                    <tbody>
                      {service.methods
                        .filter((method) => method.options?.["google.api.http"])
                        .map((method, methodIndex) => (
                          <React.Fragment key={methodIndex}>
                            {method.options!["google.api.http"]!.rules.map(
                              (rule, ruleIndex) => (
                                <tr key={ruleIndex}>
                                  <td>{method.name}</td>
                                  <td>{rule.method}</td>
                                  <td>{rule.pattern}</td>
                                  <td>{rule.body}</td>
                                </tr>
                              )
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      <h2 id="scalar-value-types">Scalar Value Types</h2>
      <table className="scalar-value-types-table">
        <thead>
          <tr>
            <td>.proto Type</td>
            <td>Notes</td>
            <td>C++</td>
            <td>Java</td>
            <td>Python</td>
            <td>Go</td>
            <td>C#</td>
            <td>PHP</td>
            <td>Ruby</td>
          </tr>
        </thead>
        <tbody>
          {doc.scalarValueTypes.map((type, typeIndex) => (
            <tr id={type.protoType} key={typeIndex}>
              <td>{type.protoType}</td>
              <td>{type.notes}</td>
              <td>{type.cppType}</td>
              <td>{type.javaType}</td>
              <td>{type.pythonType}</td>
              <td>{type.goType}</td>
              <td>{type.csType}</td>
              <td>{type.phpType}</td>
              <td>{type.rubyType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default App
