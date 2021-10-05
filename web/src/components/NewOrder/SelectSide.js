/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';

function SelectSide(props) {
  const selectSide = useMemo(
    () => (
      <div className='form-group'>
        <label htmlFor='side'>Lado:</label>
        <select
          id='side'
          className='form-select'
          defaultValue={props.side}
          onChange={props.onChange}
        >
          <option value='BUY'>Comprar</option>
          <option value='SELL'>Vender</option>
        </select>
      </div>
    ),
    [props.side]
  );

  return selectSide;
}

export default SelectSide;
