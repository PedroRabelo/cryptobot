/* eslint-disable react-hooks/exhaustive-deps */
import { useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBalance } from '../../../services/ExchangeService';

function Wallet(props) {
  const history = useHistory();

  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    getBalance(token)
      .then((info) => {
        const balances = Object.entries(info).map(
          (item) => {
            return {
              symbol: item[0],
              available: item[1].available,
              onOrder: item[1].onOrder,
            };
          }
        );
        if (props.onUpdate) props.onUpdate(balances);
        setBalances(balances);
      })
      .catch((err) => {
        if (err.response && err.response.status === 401)
          return history.push('/');
        console.error(err);
      });
  }, [props.data]);

  if (!props || !props.data) return <></>;

  return (
    <div className='col-md-6 col-sm-12 mb-4'>
      <div className='card border-0 shadow'>
        <div className='card-header'>
          <div className='row'>
            <div className='col'>
              <h2 className='fs-5 fw-bold-mb-0'>
                Carteira
              </h2>
            </div>
          </div>
        </div>
        <div className='table-resonsive divScroll'>
          <table className='table align-items-center table-flush table-sm table-hover tableFixHead'>
            <thead className='thead-light'>
              <tr>
                <th className='border-bottom' scope='col'>
                  SÍMBOLO
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  DISPONÍVEL
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  BLOQUEADO
                </th>
              </tr>
            </thead>
            <tbody>
              {balances.map((item) => (
                <tr key={`wallet${item.symbol}`}>
                  <td className='text-gray-900'>
                    {item.symbol}
                  </td>
                  <td className='text-gray-900'>
                    {item.available.substring(0, 8)}
                  </td>
                  <td className='text-gray-900'>
                    {item.onOrder.substring(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
