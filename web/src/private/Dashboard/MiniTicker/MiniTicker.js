import SelectQuote, {
  filterSymbolNames,
  getDefaultQuote,
} from '../../../components/SelectQuote/SelectQuote';
import { useEffect, useState } from 'react';
import TickerRow from './TickerRow';
import { getSymbols } from '../../../services/SymbolsService';
import { useHistory } from 'react-router-dom';

function MiniTicker(props) {
  const history = useHistory();
  const [symbols, setSymbols] = useState([]);
  const [quote, setQuote] = useState(getDefaultQuote());

  useEffect(() => {
    const token = localStorage.getItem('token');
    getSymbols(token)
      .then((symbols) =>
        setSymbols(filterSymbolNames(symbols, quote))
      )
      .catch((err) => {
        if (err.response && err.response.status === 401)
          return history.push('/');
        console.error(err);
      });
  }, [history, quote]);

  function onQuoteChange(event) {
    setQuote(event.target.value);
  }

  if (!props || !props.data) return <></>;

  return (
    <div className='col-12 mb-4'>
      <div className='card border-0 shadow'>
        <div className='card-header'>
          <div className='row'>
            <div className='col'>
              <h2 className='fs-5 fw-bold mb-0'>
                Mercado 24h
              </h2>
            </div>
            <div className='col offset-md-3'>
              <SelectQuote onChange={onQuoteChange} />
            </div>
          </div>
        </div>
        <div className='table-responsive divScroll'>
          <table className='table align-items-center table-flush table-sm table-hover tableFixHead'>
            <thead className='thead-light'>
              <tr>
                <th className='border-bottom' scope='col'>
                  Símbolo
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  Fechamento
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  Abertura
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  Máximo
                </th>
                <th
                  className='border-bottom col-2'
                  scope='col'
                >
                  Mínimo
                </th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((item) => (
                <TickerRow
                  key={item}
                  symbol={item}
                  data={props.data[item]}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MiniTicker;
