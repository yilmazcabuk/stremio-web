const React = require('react');
const PropTypes = require('prop-types');
const classnames = require('classnames');
const { useRouteFocused } = require('stremio-router');
const Icon = require('stremio-icons/dom');
const { AddonDetailsModal, Button, Multiselect, NavBar, TextInput, SharePrompt, ModalDialog, useBinaryState } = require('stremio/common');
const Addon = require('./Addon');
const useAddons = require('./useAddons');
const useSelectableInputs = require('./useSelectableInputs');
const styles = require('./styles');

const Addons = ({ urlParams, queryParams }) => {
    const routeFocused = useRouteFocused();
    const navigate = React.useCallback((args) => {
        if (!routeFocused) {
            return;
        }

        const nextPath = args.hasOwnProperty('request') ?
            `/${encodeURIComponent(args.request.base)}/${encodeURIComponent(args.request.path.id)}/${encodeURIComponent(args.request.path.type_name)}`
            :
            typeof urlParams.transportUrl === 'string' && typeof urlParams.catalogId === 'string' && typeof urlParams.type === 'string' ?
                `/${encodeURIComponent(urlParams.transportUrl)}/${encodeURIComponent(urlParams.catalogId)}/${encodeURIComponent(urlParams.type)}`
                :
                '';
        const nextQueryParams = new URLSearchParams(queryParams);
        if (args.hasOwnProperty('detailsTransportUrl')) {
            if (args.detailsTransportUrl === null) {
                nextQueryParams.delete('addon');
            } else {
                nextQueryParams.set('addon', args.detailsTransportUrl);
            }
        }

        window.location.replace(`#/addons${nextPath}?${nextQueryParams}`);
    }, [routeFocused, urlParams, queryParams]);
    const addons = useAddons(urlParams);
    const detailsTransportUrl = queryParams.get('addon');
    const selectInputs = useSelectableInputs(addons, navigate);
    const [addAddonModalOpen, openAddAddonModal, closeAddAddonModal] = useBinaryState(false);
    const addAddonUrlInputRef = React.useRef(null);
    const addAddonOnSubmit = React.useCallback(() => {
        if (addAddonUrlInputRef.current !== null) {
            navigate({ detailsTransportUrl: addAddonUrlInputRef.current.value });
        }
    }, [navigate]);
    const addAddonModalButtons = React.useMemo(() => {
        return [
            {
                className: styles['cancel-button'],
                label: 'Cancel',
                props: {
                    onClick: closeAddAddonModal
                }
            },
            {
                label: 'Add',
                props: {
                    onClick: addAddonOnSubmit
                }
            }
        ];
    }, [addAddonOnSubmit]);
    const [search, setSearch] = React.useState('');
    const searchInputOnChange = React.useCallback((event) => {
        setSearch(event.currentTarget.value);
    }, []);
    const [sharedTransportUrl, setSharedTransportUrl] = React.useState(null);
    const clearSharedTransportUrl = React.useCallback(() => {
        setSharedTransportUrl(null);
    }, []);
    const onAddonShare = React.useCallback((event) => {
        setSharedTransportUrl(event.dataset.transportUrl);
    }, []);
    const onAddonToggle = React.useCallback((event) => {
        navigate({ detailsTransportUrl: event.dataset.transportUrl });
    }, [navigate]);
    const closeAddonDetails = React.useCallback(() => {
        navigate({ detailsTransportUrl: null });
    }, [navigate]);
    React.useLayoutEffect(() => {
        closeAddAddonModal();
        setSearch('');
        clearSharedTransportUrl();
    }, [urlParams, queryParams]);
    return (
        <div className={styles['addons-container']}>
            <NavBar className={styles['nav-bar']} backButton={true} title={'Addons'} />
            <div className={styles['addons-content']}>
                <div className={styles['notice-container']}>
                    <Button className={styles['close-button-container']} title={'dismiss'}>
                        <div className={styles['label']}>dismiss</div>
                        <Icon className={styles['icon']} icon={'ic_x'} />
                    </Button>
                    <div className={styles['notice']}>
                        <Icon className={styles['icon']} icon={'ic_addons'} />
                        <div className={styles['label']}>This is your addon catalogue - here you can search and install addons to improve your watching experience.</div>
                    </div>
                </div>
                <div className={styles['selectable-inputs-container']}>
                    <div className={styles['selectable-inputs']}>
                        <Button className={styles['add-button-container']} title={'Add addon'} onClick={openAddAddonModal}>
                            <Icon className={styles['icon']} icon={'ic_plus'} />
                            <div className={styles['add-button-label']}>Add addon</div>
                        </Button>
                        <Multiselect {...selectInputs[1]} className={styles['select-input-container']} />
                        <div className={styles['select-input-options']}>
                            {selectInputs[0].options.map((option, index) => (
                                <Button key={index} className={classnames(styles['option-container'], { 'selected': selectInputs[0].selected.includes(option.value) })} onClick={() => selectInputs[0].onSelect(option)}>
                                    {option.label} addons
                                </Button>
                            ))}
                        </div>
                    </div>
                    <label className={styles['search-bar-container']}>
                        <TextInput
                            className={styles['search-input']}
                            type={'text'}
                            placeholder={'Search addons'}
                            value={search}
                            onChange={searchInputOnChange}
                        />
                        <Icon className={styles['icon']} icon={'ic_search'} />
                    </label>
                </div>
                {
                    addons.selectable.catalogs.length === 0 && addons.catalog_resource === null ?
                        <div className={styles['message-container']}>
                            No addons
                        </div>
                        :
                        addons.catalog_resource === null ?
                            <div className={styles['message-container']}>
                                No select
                            </div>
                            :
                            addons.catalog_resource.content.type === 'Err' ?
                                <div className={styles['message-container']}>
                                    Addons could not be loaded
                                </div>
                                :
                                addons.catalog_resource.content.type === 'Loading' ?
                                    <div className={styles['message-container']}>
                                        Loading
                                    </div>
                                    :
                                    <div className={styles['addons-list-container']}>
                                        {
                                            addons.catalog_resource.content.content
                                                .filter((addon) => {
                                                    return search.length === 0 ||
                                                        (
                                                            (typeof addon.manifest.name === 'string' && addon.manifest.name.toLowerCase().includes(search.toLowerCase())) ||
                                                            (typeof addon.manifest.description === 'string' && addon.manifest.description.toLowerCase().includes(search.toLowerCase()))
                                                        );
                                                })
                                                .map((addon, index) => (
                                                    <Addon
                                                        key={index}
                                                        className={styles['addon']}
                                                        id={addon.manifest.id}
                                                        name={addon.manifest.name}
                                                        version={addon.manifest.version}
                                                        logo={addon.manifest.logo}
                                                        description={addon.manifest.description}
                                                        types={addon.manifest.types}
                                                        installed={addon.installed}
                                                        onToggle={onAddonToggle}
                                                        onShare={onAddonShare}
                                                        dataset={{ transportUrl: addon.transportUrl }}
                                                    />
                                                ))
                                        }
                                    </div>
                }
            </div>
            {
                addAddonModalOpen ?
                    <ModalDialog
                        className={styles['add-addon-modal-container']}
                        title={'Add addon'}
                        buttons={addAddonModalButtons}
                        onCloseRequest={closeAddAddonModal}>
                        <TextInput
                            ref={addAddonUrlInputRef}
                            className={styles['addon-url-input']}
                            type={'text'}
                            placeholder={'Paste url...'}
                            onSubmit={addAddonOnSubmit}
                        />
                    </ModalDialog>
                    :
                    null
            }
            {
                typeof sharedTransportUrl === 'string' ?
                    <ModalDialog
                        className={styles['share-modal-container']}
                        title={'Share addon'}
                        onCloseRequest={clearSharedTransportUrl}>
                        <SharePrompt
                            className={styles['share-prompt-container']}
                            url={sharedTransportUrl}
                        />
                    </ModalDialog>
                    :
                    null
            }
            {
                typeof detailsTransportUrl === 'string' ?
                    <AddonDetailsModal
                        transportUrl={detailsTransportUrl}
                        onCloseRequest={closeAddonDetails}
                    />
                    :
                    null
            }
        </div>
    );
};

Addons.propTypes = {
    urlParams: PropTypes.exact({
        transportUrl: PropTypes.string,
        catalogId: PropTypes.string,
        type: PropTypes.string
    }),
    queryParams: PropTypes.instanceOf(URLSearchParams)
};

module.exports = Addons;
