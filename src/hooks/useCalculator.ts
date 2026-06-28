import { useState } from 'react';
import { applyOperator } from '../utils/calc';

export interface Calculator {
  amount: string;
  setAmount: (v: string) => void;
  operator: string | null;
  hasOperator: boolean;
  inputNumber: (val: string) => void;
  inputOperator: (op: string) => void;
  del: () => void;
  /** Apply any pending operation and return the resulting amount. */
  evaluate: () => string;
  reset: () => void;
}

export function useCalculator(initial = '0'): Calculator {
  const [amount, setAmount] = useState(initial);
  const [prevAmount, setPrevAmount] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isNewInput, setIsNewInput] = useState(false);

  const compute = (): string => {
    if (!operator || prevAmount === null) return amount;
    return String(applyOperator(parseFloat(prevAmount), parseFloat(amount), operator));
  };

  const inputNumber = (val: string) => {
    if (isNewInput) {
      setAmount(val === '.' ? '0.' : val);
      setIsNewInput(false);
    } else {
      if (val === '.' && amount.includes('.')) return;
      setAmount((prev) => (prev === '0' && val !== '.' ? val : prev + val));
    }
  };

  const inputOperator = (op: string) => {
    if (operator && !isNewInput) {
      const result = compute();
      setAmount(result);
      setPrevAmount(result);
    } else {
      setPrevAmount(amount);
    }
    setOperator(op);
    setIsNewInput(true);
  };

  const del = () => {
    if (isNewInput) return;
    setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const evaluate = (): string => {
    const result = compute();
    setAmount(result);
    setPrevAmount(null);
    setOperator(null);
    setIsNewInput(true);
    return result;
  };

  const reset = () => {
    setAmount('0');
    setPrevAmount(null);
    setOperator(null);
    setIsNewInput(false);
  };

  return {
    amount, setAmount, operator, hasOperator: !!operator,
    inputNumber, inputOperator, del, evaluate, reset,
  };
}
