'use strict';
/**
 * 扫码识别
 */
require('../../services/common/index.service');
angular
    .module('app.ticket')
    .controller('TicketSanController', TicketSanController);

TicketSanController.$inject = ['$scope', '$uibModalInstance', 'Alert', 'data', '$state', 'CommoneService', '$window', 'Upload'];

/* @ngInject */
function TicketSanController($scope, $uibModalInstance, Alert, data, $state, CommoneService, $window, Upload) {

    $scope.iteminfo = data || null;

    $scope.isresult = false;
    $scope.result = '';

    $scope.isinit = true;
    $scope.btntext = '点击确认';

    let video = null;
    let canvas = null;
    let context = null;

    //访问用户媒体设备的兼容方法
    function getUserMedia(constraints, success, error) {
        if (navigator.mediaDevices.getUserMedia) {
          //最新的标准API
          navigator.mediaDevices.getUserMedia(constraints).then(success).catch(error);
        } else if (navigator.webkitGetUserMedia) {
          //webkit核心浏览器
          navigator.webkitGetUserMedia(constraints,success, error)
        } else if (navigator.mozGetUserMedia) {
          //firfox浏览器
          navigator.mozGetUserMedia(constraints, success, error);
        } else if (navigator.getUserMedia) {
          //旧版API
          navigator.getUserMedia(constraints, success, error);
        }
    }
  
    function success(stream) {
        //兼容webkit核心浏览器
        let CompatibleURL = window.URL || window.webkitURL;
        //将视频流设置为video元素的源
        //video.src = CompatibleURL.createObjectURL(stream);
        video.srcObject = stream;
        video.play();
    }
  
    function error(error) {
        Alert.showMessage(`访问用户媒体设备失败${error.name}, ${error.message}`);
    }

    //将base64转换为文件
    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    }

    /**
     * 拍照
     */
    $scope.tosan = function () {
        $scope.isinit = false;
        $scope.btntext = '重新拍照';
        context.drawImage(video, 0, 0, 480, 180);    
        var _img = canvas.toDataURL("image/jpeg");
        $scope.isresult = true;
        $scope.result = '';
        var _file = dataURLtoFile(_img, 'sanimages.jpg');
        // 上传
        Upload.upload({
            url: '/api/main/upload-file',
            data: {file: _file}
        }).then(function (resp) {
            if (resp && resp.data) {
                CommoneService.getScanDBOCR({
                    imgurl: resp.data.data.previewLink
                }).then((res) => {
                    $scope.result = res;
                }, (err) => {
                    Alert.showMessage('识别失败，请调整光线重新再试或手动输入！');    
                })
            } else {
                Alert.showMessage('识别失败，请调整光线重新再试或手动输入！');
            }
        }, function (err) {
        }, function (errmsg) {
        });
    }

    /**
     * 确认
     */
    $scope.confrom = function () {
        if ($scope.result != '') {
            Alert.showMessageSure({ 
                title: '温馨提示',
                message: '请再次确认该识别结果是否正确？',
                confirm: function (object) {
                    $uibModalInstance.close({ result: $scope.result });
                }
            })
        } else {
            $uibModalInstance.close({ result: '' });
        }
    }

    // 取消
    $scope.cancel = function () { 
        $uibModalInstance.dismiss('cancel');
    }

    $scope.$watch('$viewContentLoaded', function(){
        video = document.getElementById('video');
        canvas = document.getElementById('ticket_san_canvas');
        context = canvas.getContext('2d');
        if (navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
            //调用用户媒体设备, 访问摄像头
            getUserMedia({video : {width: 480, height: 180}}, success, error);
        } else {
            Alert.showMessage('不支持访问用户媒体');
        }
    });
}