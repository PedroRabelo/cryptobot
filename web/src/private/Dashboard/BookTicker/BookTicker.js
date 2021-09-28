import { useEffect, useState } from 'react';
import SelectQuote, {
  filterSymbolNames,
  getDefaultQuote,
} from '../../../components/SelectQuote/SelectQuote';
import { useHistory } from 'react-router-dom';
import { getSymbols } from '../../../services/SymbolsService';
import BookRow from './BookRow';

function BookTicker(props) {
  const history = useHistory();
  const [quote, setQuote] = useState(getDefaultQuote());
  const [symbols, setSymbols] = useState([]);

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
    <>
      <div className='col-sm-12 col-md-6 mb-4'>
        <div className='card border-0 shadow'>
          <div className='card-header'>
            <div className='row'>
              <div className='col'>
                <h2 className='fs-5 fw-bold mb-0'>
                  Livro de ofertas
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
                  <th
                    className='border-bottom col-2'
                    scope='col'
                  >
                    Símbolo
                  </th>
                  <th
                    className='border-bottom col-2'
                    scope='col'
                  >
                    Compra
                  </th>
                  <th
                    className='border-bottom col-2'
                    scope='col'
                  >
                    Venda
                  </th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((item) => (
                  <BookRow
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
    </>
  );
}

export default BookTicker;
