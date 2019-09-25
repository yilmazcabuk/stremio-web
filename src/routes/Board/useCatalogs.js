const React = require('react');
const { useServices } = require('stremio/services');

const useCatalogs = () => {
    const [catalogs, setCatalogs] = React.useState([]);
    const { core } = useServices();
    React.useEffect(() => {
        const onNewState = () => {
            const state = core.getState();
            setCatalogs(state.catalogs.groups);
        };
        core.on('NewModel', onNewState);
        core.dispatch({
            action: 'Load',
            args: {
                load: 'CatalogGrouped',
                args: { extra: [] }
            }
        });
        return () => {
            core.off('NewModel', onNewState);
        };
    }, []);
    return catalogs;
};

module.exports = useCatalogs;
