import { FIELD_TYPES, SORT_DIRECTION, FLOW_BOOLEAN_VALUES } from 'c/odDatatableConstants';

export function isEmpty(value) {
  return value === undefined || value === null;
}

export function isBlank(value) {
  return isEmpty(value) || value === '' || value === ' ';
}

/**
 * Reduces one or more LDS errors into a string[] of error messages.
 * @param {FetchResponse|FetchResponse[]} errors
 * @return {String[]} Error messages
 */
export function reduceErrors(errors) {
  if (!Array.isArray(errors)) {
    errors = [errors];
  }

  return (
    errors
      // Remove null/undefined items
      .filter((error) => !!error)
      // Extract an error message
      .map((error) => {
        // UI API read errors
        if (Array.isArray(error.body)) {
          return error.body.map((e) => e.message);
        }
        // Page level errors
        else if (error?.body?.pageErrors && error.body.pageErrors.length > 0) {
          return error.body.pageErrors.map((e) => e.message);
        }
        // Field level errors
        else if (error?.body?.fieldErrors && Object.keys(error.body.fieldErrors).length > 0) {
          const fieldErrors = [];
          Object.values(error.body.fieldErrors).forEach((errorArray) => {
            fieldErrors.push(...errorArray.map((e) => e.message));
          });
          return fieldErrors;
        }
        // UI API DML page level errors
        else if (error?.body?.output?.errors && error.body.output.errors.length > 0) {
          return error.body.output.errors.map((e) => e.message);
        }
        // UI API DML field level errors
        else if (error?.body?.output?.fieldErrors && Object.keys(error.body.output.fieldErrors).length > 0) {
          const fieldErrors = [];
          Object.values(error.body.output.fieldErrors).forEach((errorArray) => {
            fieldErrors.push(...errorArray.map((e) => e.message));
          });
          return fieldErrors;
        }
        // UI API DML, Apex and network errors
        else if (error.body && typeof error.body.message === 'string') {
          let errorToReturn;
          // try the json
          try {
            const parsed = JSON.parse(error.body.message);
            const statusCode = parsed.code;
            errorToReturn = `${statusCode !== 700 ? 'ERROR: ' : ''}${parsed.message}`;
          } catch (e) {
            errorToReturn = error.body.message;
          }

          return errorToReturn;
        }
        // JS errors
        else if (typeof error.message === 'string') {
          return error.message;
        }
        // Unknown error shape so try HTTP status text
        return error.statusText;
      })
      // Flatten
      .reduce((prev, curr) => prev.concat(curr), [])
      // Remove empty strings
      .filter((message) => !!message)
  );
}

export function getBodyPopupClasses(that) {
  const classes = 'body-popup';

  if (window.innerHeight - that.popupHeight < 200) {
    that._alreadyRendered = false;
    return `${classes} slds-scrollable--y`;
  }

  return classes;
}

export function getPopupHeight(that) {
  let height = 0;

  // get the elements
  const titleElement = that.template.querySelector('.title-popup');
  const bodyElement = that.template.querySelector('.body-popup');
  const footerElement = that.template.querySelector('.footer-popup');

  if (titleElement) {
    const titleRect = titleElement.getBoundingClientRect();
    height += titleRect.height + 34; // height + padding and border
  }

  if (bodyElement) {
    const bodyRect = bodyElement.getBoundingClientRect();
    height += bodyRect.height;
  }

  if (footerElement) {
    const footerRect = footerElement.getBoundingClientRect();
    height += footerRect.height + 26; // height + padding and border
  }

  return height;
}

export function sortArrayByProperty(array, property, direction = SORT_DIRECTION.ASC.value) {
  return array.sort((a, b) => {
    const aProp = a[property] || 9998;
    const bProp = b[property] || 9999;
    const fa = isNaN(aProp) ? aProp.toLowerCase() : aProp;
    const fb = isNaN(bProp) ? bProp.toLowerCase() : bProp;

    if (fa < fb) {
      return direction === SORT_DIRECTION.ASC.value ? -1 : 1;
    }
    if (fa > fb) {
      return direction === SORT_DIRECTION.ASC.value ? 1 : -1;
    }

    return 0;
  });
}

export function getFieldType(type) {
  return [FIELD_TYPES.STRING, FIELD_TYPES.ADDRESS].includes(type) ? FIELD_TYPES.TEXT : type;
}

export function getPrecision(field) {
  return field.precision > 0 ? field.precision - field.scale : field.digits;
}

export function generateRandomString(stringLength = 36, sliceStart = 2, sliceEnd = 12) {
  return Math.random().toString(stringLength).slice(sliceStart, sliceEnd);
}

export function getFieldsFromString(string) {
  return string.match(/(?<={{)(.*?)(?=}})/g);
}

export function doReplaceMergeField(value, fieldToReplace, record) {
  const regex = new RegExp('{{' + fieldToReplace + '}}', 'g');

  // get the field name
  const fieldName = fieldToReplace.replace(`Record.`, '');

  return value.replace(regex, record[fieldName]);
}

export function formatDateForInput(date) {
  return (
    date.getFullYear() +
    '-' +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    '-' +
    date.getDate().toString().padStart(2, '0')
  );
}

export function getSummarizeFieldTypeToDisplay(type) {
  if (
    [
      FIELD_TYPES.ADDRESS,
      FIELD_TYPES.CHECKBOX,
      FIELD_TYPES.EMAIL,
      FIELD_TYPES.ID,
      FIELD_TYPES.LONG_TEXTAREA,
      FIELD_TYPES.LOOKUP,
      FIELD_TYPES.MULTISELECT,
      FIELD_TYPES.PHONE,
      FIELD_TYPES.RADIO_BUTTON_TYPE,
      FIELD_TYPES.RICH_TEXTAREA,
      FIELD_TYPES.SEARCH,
      FIELD_TYPES.SELECT,
      FIELD_TYPES.STRING,
      FIELD_TYPES.TEXT,
      FIELD_TYPES.TEXTAREA,
      FIELD_TYPES.TOGGLE,
      FIELD_TYPES.URL,
    ].includes(type)
  ) {
    return FIELD_TYPES.TEXT;
  }

  return type;
}

export function countWords(str) {
  const matches = str.match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

/**
 * Evaluates a value from Flow (global constant, variable, or literal)
 * Handles: {!$GlobalConstant.True}, {!$GlobalConstant.False}, {!varName}, true, false
 * @param {*} value - The value from Flow
 * @returns {Boolean} - The evaluated boolean value
 */
export function parseFlowBoolean(value) {
  // If already boolean, return it
  if (typeof value === 'boolean') {
    return value;
  }

  // If null/undefined/empty, default to false
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Convert to string and trim
  const stringValue = String(value).trim().toLowerCase();

  // Check for true values
  if (FLOW_BOOLEAN_VALUES.TRUE.some(v => stringValue === v.toLowerCase())) {
    return true;
  }

  // Everything else is false
  return false;
}

// =================================================================
// Expression evaluator for conditional column visibility
// =================================================================

/**
 * Extracts field API names referenced in an expression string.
 * Field names are identifiers that are NOT string literals, numbers, booleans, or operators.
 * @param {String} expression - e.g. 'Service_Type__c == "Bus Pass" && Active__c == true'
 * @returns {String[]} - e.g. ['Service_Type__c', 'Active__c']
 */
export function extractFieldsFromExpression(expression) {
  if (!expression) return [];
  const tokens = tokenizeExpression(expression);
  const fields = [];
  for (const token of tokens) {
    if (token.type === 'IDENTIFIER' && !fields.includes(token.value)) {
      fields.push(token.value);
    }
  }
  return fields;
}

/**
 * Evaluates a boolean expression against a record's field values.
 * Supports: ==, !=, >, <, >=, <=, &&, ||, !, parentheses
 * Literals: "string", 123, true, false, null
 * @param {String} expression - e.g. 'Service_Type__c == "Bus Pass"'
 * @param {Object} record - field values keyed by API name
 * @returns {Boolean} - result of the expression
 */
export function evaluateExpression(expression, record) {
  if (!expression || !record) return false;
  try {
    const tokens = tokenizeExpression(expression);
    const parser = new ExpressionParser(tokens, record);
    return !!parser.parseOr();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Expression evaluation error:', e.message, '| Expression:', expression);
    return false;
  }
}

const TOKEN_PATTERNS = [
  { type: 'WHITESPACE', regex: /^\s+/ },
  { type: 'STRING', regex: /^"([^"]*)"/ },
  { type: 'STRING', regex: /^'([^']*)'/ },
  { type: 'NUMBER', regex: /^-?\d+(\.\d+)?/ },
  { type: 'OP', regex: /^(==|!=|>=|<=|&&|\|\||[><!()])/ },
  { type: 'IDENTIFIER', regex: /^[a-zA-Z_]\w*/ },
];

const BOOLEAN_KEYWORDS = { true: true, false: false, null: null };

function tokenizeExpression(expression) {
  const tokens = [];
  let remaining = expression;

  while (remaining.length > 0) {
    let matched = false;

    for (const pattern of TOKEN_PATTERNS) {
      const match = remaining.match(pattern.regex);
      if (match) {
        if (pattern.type !== 'WHITESPACE') {
          let value = match[0];
          let type = pattern.type;

          if (type === 'STRING') {
            value = match[1]; // captured group without quotes
          } else if (type === 'NUMBER') {
            value = parseFloat(value);
            type = 'LITERAL';
          } else if (type === 'IDENTIFIER' && value in BOOLEAN_KEYWORDS) {
            value = BOOLEAN_KEYWORDS[value];
            type = 'LITERAL';
          }

          tokens.push({ type, value });
        }
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      throw new Error(`Unexpected character: ${remaining[0]}`);
    }
  }

  return tokens;
}

class ExpressionParser {
  constructor(tokens, record) {
    this.tokens = tokens;
    this.record = record;
    this.pos = 0;
  }

  peek() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  consume(expectedType, expectedValue) {
    const token = this.peek();
    if (!token) throw new Error(`Unexpected end of expression`);
    if (expectedType && token.type !== expectedType) {
      throw new Error(`Expected ${expectedType} but got ${token.type}`);
    }
    if (expectedValue !== undefined && token.value !== expectedValue) {
      throw new Error(`Expected '${expectedValue}' but got '${token.value}'`);
    }
    this.pos++;
    return token;
  }

  // OR: expr (|| expr)*
  parseOr() {
    let left = this.parseAnd();
    while (this.peek()?.value === '||') {
      this.consume('OP', '||');
      const right = this.parseAnd();
      left = left || right;
    }
    return left;
  }

  // AND: expr (&& expr)*
  parseAnd() {
    let left = this.parseNot();
    while (this.peek()?.value === '&&') {
      this.consume('OP', '&&');
      const right = this.parseNot();
      left = left && right;
    }
    return left;
  }

  // NOT: !expr | comparison
  parseNot() {
    if (this.peek()?.value === '!') {
      this.consume('OP', '!');
      return !this.parseNot();
    }
    return this.parseComparison();
  }

  // COMPARISON: value (op value)?
  parseComparison() {
    const left = this.parseValue();
    const token = this.peek();
    if (token && token.type === 'OP' && ['==', '!=', '>', '<', '>=', '<='].includes(token.value)) {
      this.consume('OP');
      const right = this.parseValue();
      switch (token.value) {
        case '==':
          return left == right; // eslint-disable-line eqeqeq
        case '!=':
          return left != right; // eslint-disable-line eqeqeq
        case '>':
          return left > right;
        case '<':
          return left < right;
        case '>=':
          return left >= right;
        case '<=':
          return left <= right;
        default:
          return false;
      }
    }
    return left;
  }

  // VALUE: (expr) | literal | string | identifier (field reference)
  parseValue() {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of expression');

    if (token.value === '(') {
      this.consume('OP', '(');
      const result = this.parseOr();
      this.consume('OP', ')');
      return result;
    }

    if (token.type === 'LITERAL') {
      this.consume('LITERAL');
      return token.value;
    }

    if (token.type === 'STRING') {
      this.consume('STRING');
      return token.value;
    }

    if (token.type === 'IDENTIFIER') {
      this.consume('IDENTIFIER');
      return this.record[token.value];
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }
}