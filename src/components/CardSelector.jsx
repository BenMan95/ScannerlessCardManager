import { useEffect, useState } from 'react';

function Selector(props) {
    const [formVals, setVals] = useState({name:'', set:'', cn:''});
    const [results, setResults] = useState([]);
    const [hovered, setHovered] = useState(null);
    const [shift, setShift] = useState(false);

    useEffect(() => {
        const press = e => {if (e.key === 'Shift') setShift(true)};
        const unpress = e => {if (e.key === 'Shift') setShift(false)};

        document.addEventListener('keydown', press);
        document.addEventListener('keyup', unpress);

        return () => {
            document.removeEventListener('keydown', press);
            document.removeEventListener('keyup', unpress);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const filters = [];
        if (formVals.name) filters.push(`name:'${formVals.name}'`);
        if (formVals.set) filters.push(`s:'${formVals.set}'`);
        if (formVals.cn) filters.push(`cn:'${formVals.cn}'`);

        if (formVals.name || formVals.set || formVals.cn) {
            const query = filters.join(' ');
            let next_url = encodeURI(`https://api.scryfall.com/cards/search?unique=prints&q=not:digital include:extras ${query}`);
            setTimeout(async () => {
                try {
                    do {
                        const response = await fetch(next_url, {signal:controller.signal});
                        const json = await response.json();

                        if (json.object === 'error') {
                            alert(`${json.status} Error: ${json.code}\n${json.details}`);
                            return;
                        }

                        setResults(current => [...current, ...json.data]);
                        setHovered(current => current || json.data[0]);

                        next_url = json.has_more && json.next_page;
                    } while (next_url);
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.log(e);
                    }
                }
            }, 500);
        }

        return () => {
            controller.abort();
            setResults([]);
            setHovered(null);
        };
    }, [formVals]);

    function updateName(e) {
        const newVal = e.target.value.replaceAll('"','');
        setVals({...formVals, name:newVal})
    }

    function updateSet(e) {
        const newVal = e.target.value.replaceAll(' ','');
        setVals({...formVals, set:newVal})
    }

    function updateCN(e) {
        const newVal = e.target.value.replaceAll(' ','');
        setVals({...formVals, cn:newVal})
    }

    function selectCard(card) {
        if (card != null) {
            props.onSelect(card);
        }

        setVals({name:'', set:'', cn:''});
        setResults([]);
        setHovered(null);
    }

    function handleSubmit(e) {
        e.preventDefault();
        selectCard(hovered);
    }

    return (
        <div id="outer">
            <div id="inner">
                <form id="search" autoComplete="off" onSubmit={handleSubmit}>
                    <p>
                        <label htmlFor="name">Card Name: </label>
                        <input value={formVals.name} name="name" placeholder="Card Name" onChange={updateName} autoFocus/>
                    </p>
                    <p>
                        <label htmlFor="set">Set Code: </label>
                        <input value={formVals.set} name="set" placeholder="Set Code" onChange={updateSet}/>
                    </p>
                    <p>
                        <label htmlFor="cn">Number: </label>
                        <input value={formVals.cn} name="cn" placeholder="Collector Number" onChange={updateCN}/>
                    </p>
                    <input type="submit" hidden/>
                </form>
                <div id="big-card-container">
                    {hovered && (
                        <img className="card" id="big-card" alt="Selected Card"
                             src={(hovered.image_uris ?? hovered.card_faces[0].image_uris).large}/>
                    )}
                </div>
            </div>
            <div id="small-cards">
                {results.filter(card => card.image_status !== 'missing')
                        .map(card => {
                    const images = card.image_uris ?? card.card_faces[0].image_uris;
                    return (<img className="card"
                                 src={images.small}
                                 key={card.id}
                                 alt={card.name}
                                 onMouseOver={() => setHovered(card)}
                                 onClick={() => selectCard(card)}/>)
                })}
            </div>
        </div>
    );
}

export default Selector;