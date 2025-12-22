interface SwaggerProperty {
  type?: string;
  format?: string;
  $ref?: string;
  items?: SwaggerProperty;
  enum?: string[];
  description?: string;
  // OpenAPI 3.0+ 호환성 추가
  oneOf?: SwaggerProperty[];
  allOf?: SwaggerProperty[];
}

interface SwaggerDefinition {
  type: string;
  required?: string[];
  properties?: Record<string, SwaggerProperty>;
}

interface SwaggerSchema {
  swagger?: string; // v2
  openapi?: string; // v3
  definitions?: Record<string, SwaggerDefinition>; // Swagger 2.0 구조
  components?: {
    // OpenAPI 3.0 구조
    schemas?: Record<string, SwaggerDefinition>;
  };
}

interface TypeBlock {
  name: string;
  code: string;
}

// 1. 단일 속성 타입 변환
const getTypeScriptType = (prop: SwaggerProperty): string => {
  if (prop.$ref) {
    // "#/definitions/UserDTO" -> "UserDTO"
    return prop.$ref.split("/").pop() || "any";
  }

  switch (prop.type) {
    case "integer":
    case "number":
      return "number";
    case "string":
      if (prop.enum) return prop.enum.map((e) => `'${e}'`).join(" | ");
      return "string";
    case "boolean":
      return "boolean";
    case "array":
      return `${getTypeScriptType(prop.items || {})}[]`;
    default:
      return "any";
  }
};

// 2. 단일 정의(Definition)를 TypeScript Interface 문자열로 변환
const generateInterface = (name: string, schema: SwaggerDefinition): string => {
  if (!schema.properties) return `export interface ${name} {}`;

  const props = Object.entries(schema.properties)
    .map(([propName, propConfig]) => {
      const isRequired = schema.required && schema.required.includes(propName);
      const type = getTypeScriptType(propConfig);
      const description = propConfig.description
        ? `  /** ${propConfig.description} */\n`
        : "";
      return `${description}  ${propName}${isRequired ? "" : "?"}: ${type};`;
    })
    .join("\n");

  return `export interface ${name} {\n${props}\n}`;
};

// 3. 전체 파싱 함수 (객체 배열 형태로 반환)
const parseSwaggerToTypeBlocks = (swaggerJson: SwaggerSchema): TypeBlock[] => {
  if (!swaggerJson) return [];

  // Swagger JSON에서 schemas 추출
  const definitions =
    swaggerJson.definitions || swaggerJson.components?.schemas || {};

  return Object.entries(definitions).map(([key, value]) => {
    return {
      name: key, // 검색 및 식별용 키
      code: generateInterface(key, value), // 변환된 TS 코드
    };
  });
};

export { getTypeScriptType, generateInterface, parseSwaggerToTypeBlocks };
export type { SwaggerProperty, SwaggerDefinition, SwaggerSchema, TypeBlock };
