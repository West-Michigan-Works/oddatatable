import { FIELD_TYPES, SORT_DIRECTION } from 'c/odDatatableConstants';

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
