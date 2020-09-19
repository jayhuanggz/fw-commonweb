define('framework/client_store', function () {

    var storage = window.sessionStorage;


    var ClientStore = {

        name: 'X-AUTH-CLIENT',

        get: function () {
            return storage.getItem(ClientStore.name);
        },

        set: function (client) {


            if (client === undefined || client === null) {
                this.remove();
            } else {

                storage.setItem(ClientStore.name, client);
            }


        },
        remove: function () {
            storage.removeItem(ClientStore.name);
        }

    };

    window.ClientStore = ClientStore;


});