/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';

function BookRow(props) {
  const [data, setData] = useState({
    bestBid: '0',
    bestAsk: '0',
  });

  const bookRow = useMemo(
    () => (
      <tr>
        <td className='text-gray-900'>{props.symbol}</td>
        <td className='text-gray-900'>
          {`${data.bestBid}`.substring(0, 8)}
        </td>
        <td className='text-gray-900'>
          {`${data.bestAsk}`.substring(0, 8)}
        </td>
      </tr>
    ),
    [props.symbol, data.bestBid, data.bestAsk]
  );

  useEffect(() => {
    if (!props.data) return;

    if (data.bid !== props.data.bestBid)
      data.bid = props.data.bestBid;

    if (data.ask !== props.data.bestAsk)
      data.ask = props.data.bestAsk;

    setData(data);
  }, [props.data]);

  return bookRow;
}

export default BookRow;
