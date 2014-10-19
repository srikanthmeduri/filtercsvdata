var app = angular.module('myApp', ['smartTable.table']);
app.factory('Services', function ($http, $q) {
    return {
        getServerData: function () {
            var d = $q.defer();
            $http.get('/getData')
                .then(function (response) {
                    d.resolve(response.data);
                }, function err(reason) {
                    d.reject(reason);
                });
            return d.promise;
        },
        uploadFilteredViewJson: function (fn, obj) {
            var d = $q.defer();
            $http.post('/uploadFiltered', obj, {
                headers: {
                    'fileName': fn
                }
            }).then(function (response) {
                d.resolve(response.data);
            }, function err(reason) {
                d.reject(reason);
            });
            return d.promise;
        },
        csvProcess: function (formData) {
            var d = $q.defer();
            $http.post('/getData', formData, {
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: function (data) {
                    return data;
                }
            }).then(function (response) {
                d.resolve(response.data);
            }, function err(reason) {
                d.reject(reason);
            });
            return d.promise;
        },
        dynamicSort: function (property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a, b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },
        handleDragOver: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        },
        filterServerArray: function (a1, a2) {
            var result = [],
                key1, key2, desk1, desk2;
            for(i = 0, j = a2.length; i < j; i++) {
                key1 = a2[i]['Key'];
                desk1 = a2[i]['Description'];
                for(k = 0, l = a1.length; k < l; k++) {
                    key2 = a1[k]['Key'];
                    desk2 = a1[k]['Value'];
                    if(key1 === key2) {
                        result.push(a1[k]);
                    }
                }
            }
            return result;
        }
    };
});
app.controller('MainCtrl', function ($scope, Services) {
    $scope.filtered = undefined;
    //SERVER DATA TABLE
    Services.getServerData().then(function (data) {
        $scope.serverRowCollection = $scope.originalServerRowCollection = data;
        $scope.totalRows = data.length;
        var headers = data[0];
        var columnCollection = [];
        for(key in headers) {
            columnCollection.push({
                label: key,
                map: key
            });
        }
        $scope.serverColumnCollection = columnCollection;
        $scope.serverConfig = {
            isGlobalSearchActivated: true,
            syncColumns: false,
            isPaginationEnabled: true,
            itemsByPage: 10,
            maxSize: 8
        };
    });
    //CLIENT DATA TABLE
    var fileEl = document.getElementById('file');
    fileEl.addEventListener('change', handleFileSelect, false);
    var dropZone = document.getElementById('clientTableContainer');
    dropZone.addEventListener('dragover', Services.handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
    dropZone.addEventListener('click', function () {
        fileEl.value = '';
        fileEl.click();
    }, false);

    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var file, fd;
        if(evt.target.tagName === 'INPUT') {
            file = evt.target.files[0];
        } else {
            file = evt.dataTransfer.files[0];
        }
        var t = file.name;
        $scope.filename = t.substr(0, t.indexOf('.csv'));
        fd = new FormData();
        fd.append('csv', file);
        Services.csvProcess(fd).then(function (data) {
            var arr = data.sort(Services.dynamicSort('Key'));
            $scope.userRowsCount = arr.length;
            var headers = arr[0];
            $scope.clientRowCollection = arr;
            var columnCollection = [];
            for(key in headers) {
                columnCollection.push({
                    label: key,
                    map: key
                });
            }
            $scope.clientColumnCollection = columnCollection;
            $scope.clientConfig = {
                isPaginationEnabled: false,
                isGlobalSearchActivated: true,
                itemsByPage: 20,
                syncColumns: false
            };
            dropZone.style.display = 'none';
            dropZone.nextElementSibling.style.display = '';
            //$scope.$apply();
            $scope.filtered = Services.filterServerArray($scope.serverRowCollection, $scope.clientRowCollection);
        });
    }
    //EVENTS
    var Mashup = document.getElementById('Mashup');
    Mashup.addEventListener('click', function () {
        $scope.$apply(function () {
            $scope.clearRightTable();
            $scope.userRowsCount = null;
        });
    }, false);
    var Clear = document.getElementById('Clear');
    Clear.addEventListener('click', function () {
        $scope.$apply(function () {
            $scope.clearRightTable();
            $scope.resetLeftTable();
            $scope.rowsRemoved = null;
            $scope.rowsLeft = null;
            $scope.userRowsCount = null;
        });
    }, false);
    var Save = document.getElementById('Save');
    Save.addEventListener('click', function () {
        var data = angular.toJson($scope.clientRowCollection);
        var filename = prompt("Please enter file name", "");
        var fn = filename || $scope.filename;
        Services.uploadFilteredViewJson(fn, data).then(function (res) {
            alert('File Saved on Server');
        });
    }, false);
    $scope.clearRightTable = function () {
        $scope.clientColumnCollection = null;
        $scope.clientRowCollection = null;
        dropZone.style.display = '';
        dropZone.nextElementSibling.style.display = 'none';
    }
    $scope.resetLeftTable = function () {
        $scope.serverRowCollection = $scope.originalServerRowCollection;
    }
    $scope.$watch('filtered', function (newValue, oldValue) {
        if(newValue === undefined) return;
        $scope.serverRowCollection = newValue;
        $scope.rowsRemoved = $scope.totalRows - newValue.length;
        $scope.rowsLeft = newValue.length;
    });
});
