// Swagger JSON에서 schemas/definitions 추출
export const parseSwaggerToTypes = (spec: any): string => {
  const definitions = spec.components?.schemas || spec.definitions || {};
  let output = "";

  Object.keys(definitions).forEach((key) => {
    const schema = definitions[key];
    output += `export interface ${key} {\n`;

    if (schema.properties) {
      Object.keys(schema.properties).forEach((propKey) => {
        const prop = schema.properties[propKey];
        const type = mapType(prop);
        const optional = !schema.required?.includes(propKey) ? "?" : "";

        // 주석(Description)이 있으면 추가
        if (prop.description) {
          output += `  /** ${prop.description} */\n`;
        }
        output += `  ${propKey}${optional}: ${type};\n`;
      });
    }

    output += "}\n\n";
  });

  return output || "// 파싱할 스키마 정의를 찾을 수 없습니다.";
};

// 기본 타입을 TS 타입으로 매핑
const mapType = (prop: any): string => {
  if (prop.$ref) {
    // #/components/schemas/User -> User 로 추출
    return prop.$ref.split("/").pop();
  }

  switch (prop.type) {
    case "integer":
    case "number":
      return "number";
    case "string":
      return prop.format === "date-time" ? "Date" : "string";
    case "boolean":
      return "boolean";
    case "array":
      return `${mapType(prop.items || {})}[]`;
    default:
      return "any";
  }
};
