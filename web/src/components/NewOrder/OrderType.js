/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';

function OrderType(props) {
  const orderType = useMemo(
    () => (
      <div className='form-group'>
        <label htmlFor='type'>Tipo:</label>
        <select
          id='type'
          className='form-select'
          defaultValue={props.type}
          onChange={props.onChange}
        >
          <option value='ICEBERG'>Iceberg</option>
          <option value='LIMIT'>Limit</option>
          <option value='MARKET'>Market</option>
          <option value='STOP_LOSS'>Stop Loss</option>
          <option value='STOP_LOSS_LIMIT'>
            Stop Loss Limit
          </option>
          <option value='TAKE_PROFIT'>Take Profit</option>
          <option value='TAKE_PROFIT_LIMIT'>
            Take Profit Limit
          </option>
        </select>
      </div>
    ),
    [props.type]
  );

  return orderType;
}

export default OrderType;
