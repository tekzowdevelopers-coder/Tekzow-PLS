export interface DebugAnalysis {
  hasError: boolean;
  errorType: string | null;
  lineNumber: number | null;
  codeSnippet: string | null;
  message: string | null;
  friendlyExplanation: string | null;
  suggestion: string | null;
}

export function analyzeTraceback(stderr: string, sourceCode: string): DebugAnalysis {
  if (!stderr || !stderr.trim()) {
    return {
      hasError: false,
      errorType: null,
      lineNumber: null,
      codeSnippet: null,
      message: null,
      friendlyExplanation: null,
      suggestion: null,
    };
  }

  const lines = stderr.trim().split("\n");
  const codeLines = sourceCode.split("\n");

  let errorType: string | null = null;
  let message: string | null = null;
  let lineNumber: number | null = null;
  let codeSnippet: string | null = null;

  // Search for line number pattern: File "solution.py", line X or File "<exec>", line X
  const lineRegex = /File "(?:.*?solution\.py|<exec>|<string>)", line (\d+)(?:, in (.+))?/i;
  const match = stderr.match(lineRegex);
  if (match && match[1]) {
    lineNumber = parseInt(match[1], 10);
    if (lineNumber > 0 && lineNumber <= codeLines.length) {
      codeSnippet = codeLines[lineNumber - 1]?.trim() || null;
    }
  }

  // Get last line of traceback for Exception Type and Message
  const lastLine = lines[lines.length - 1];
  const exceptionMatch = lastLine.match(/^([A-Za-z_][A-Za-z0-9_]*Error|Exception):\s*(.*)$/);

  if (exceptionMatch) {
    errorType = exceptionMatch[1];
    message = exceptionMatch[2];
  } else if (lastLine.includes("SyntaxError")) {
    errorType = "SyntaxError";
    message = lastLine;
  } else if (lastLine.includes("IndentationError")) {
    errorType = "IndentationError";
    message = lastLine;
  } else {
    errorType = "RuntimeError";
    message = lastLine;
  }

  // Generate learner-friendly explanation & suggestions
  let friendlyExplanation = "An error occurred while executing your Python program.";
  let suggestion = "Double check the highlighted line and review your variable names and types.";

  switch (errorType) {
    case "SyntaxError":
      friendlyExplanation =
        "Python couldn't understand the structure of this line. Usually caused by a missing colon ':', unmatched parentheses '()', or a typo in Python keywords.";
      suggestion = "Check for matching quotes, parentheses, and ensure `if`, `for`, `while`, and `def` end with a colon `:`.";
      break;

    case "IndentationError":
      friendlyExplanation =
        "Indentation mismatch. Python uses 4-space indentation to define blocks of code (like inside loops or if-statements).";
      suggestion = "Ensure all statements inside loops, functions, and conditions are indented with 4 spaces consistently.";
      break;

    case "NameError":
      friendlyExplanation =
        "You used a variable or function name that has not been defined yet or might be misspelled.";
      suggestion = `Check the spelling of the variable in '${codeSnippet || "this line"}'. Make sure you assigned a value to it before using it.`;
      break;

    case "TypeError":
      friendlyExplanation =
        "You performed an operation on incompatible types (for example, trying to add a string and an integer directly).";
      suggestion = "Check data types. Did you forget to convert an input using `int()` or `float()`? E.g., `num = int(input())`.";
      break;

    case "ValueError":
      friendlyExplanation =
        "A function received an argument with the right type but inappropriate value (e.g. `int('abc')` or calling `input()` when expecting more values).";
      suggestion = "Check how you parse inputs. Make sure input formats match expected numbers or strings.";
      break;

    case "ZeroDivisionError":
      friendlyExplanation = "You attempted to divide a number by zero (`/` or `//` or `/%`). In mathematics and Python, division by zero is undefined.";
      suggestion = "Add a condition `if divisor != 0:` to prevent dividing when the denominator is zero.";
      break;

    case "IndexError":
      friendlyExplanation =
        "You tried to access an item in a list or string at an index that doesn't exist (out of range).";
      suggestion = "Remember Python indices start at 0 and end at `len(list) - 1`. Check your loop bounds or index.";
      break;

    case "KeyError":
      friendlyExplanation =
        "You tried to access a dictionary with a key that is not in the dictionary.";
      suggestion = "Use `key in my_dict` before accessing or use `my_dict.get(key, default)`.";
      break;

    case "AttributeError":
      friendlyExplanation =
        "You tried to call a method or access an attribute that does not exist on this object.";
      suggestion = "Verify the object type and check the available methods in the Python documentation.";
      break;

    case "EOFError":
      friendlyExplanation =
        "Python reached the End Of File (EOF) while waiting for input with `input()`.";
      suggestion = "Your program requested more `input()` calls than provided by the test case inputs.";
      break;
  }

  return {
    hasError: true,
    errorType,
    lineNumber,
    codeSnippet,
    message,
    friendlyExplanation,
    suggestion,
  };
}
