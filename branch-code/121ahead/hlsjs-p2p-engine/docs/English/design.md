## 概述
随着H5越来越普及，flash逐渐被淘汰已成为不可逆转的趋势。而在H5采用的视频传输格式中，hls由于兼容ios
和android、可以穿过任何允许HTTP数据通过的防火墙、容易使用内容分发网络来传输媒体流和码率自适应等众多
优势而在业界得到广泛使用。通过使用[hls.js](https://github.com/video-dev/hls.js)这个第三方库，
几乎所有现代浏览器都可以播放hls视频。hls天生分片传输的优势，使其可以采用p2p的方式进行传输，从而减小
服务器的负担。在web端，无插件化实现p2p传输能力的最好选择就是WebRTC技术，与hls.js类似，WebRTC也
支持几乎所有现代浏览器。本项目的目标是开发一个hls.js的插件，通过WebRTC data channel技术，在不影响
用户体验的前提下，最大化p2p率，从而为CP节省流量成本。

## 适用场景
- 点播
- 高延时直播(30s以上)
- 在已有项目中使用hls.js或即将采用hls.js

## 设计理念
- 采用仿BT算法，简化BT的流程，并且针对流媒体的特点对算法进行调整
- 不改动hls.js源码，并且可以与其无缝衔接，几行代码集成，便于在现有项目中快速集成
- 高可配置化，用户可以根据特定的使用环境调整各个参数
- 支持video.js、Clappr、Flowplayer等第三方播放器
- 通过有效的调度策略来保证用户的播放体验以及p2p率
- Tracker服务器根据访问IP的ISP、地域等进行智能调度

## 主要模块介绍
- P2P传输组件：可以在web端播放器之间直接建立P2P连接，进而创建一个数据通道，通过数据通道两个播放器之间就可以
互相分享音视频数据和其他控制信息等
- P2P调度组件：核心组件，包括以下功能：
  - 对peer的数据请求进行调度，优先满足urgent级别的需求，并且在出现丢包的情况下choke部分节点请求
  - 有效的从p2p网络中获取数据，先从缓存中查找，如果找不到再查询peer的bitmap，从peer获取数据，peer也没有的情况下再
  从服务器获取，每个环节都有回滚机制，从而在不影响用户体验的前提下最大化p2p率；
  - 在向peer请求数据时，优先请求urgent级别的数据（即将要播放的），之后根据最少优先原则请求peers中最少的buffer，
  使每个buffer在p2p网络节点中有足够的备份
- 缓存管理组件：负责对下载的数据进行缓存，并且控制缓存的大小，并在其他节点请求数据时提供相关的缓存内容
- tracker与信令控制组件：负责从tracker服务器获取足够的节点进行连接尝试与数据通道建立，并在建立数据通道的过程中
与信令服务器交流信令信息
- 统计上报组件：可以定时上传播放器的p2p统计信息，以及需要上传的日志信息，方便客户进行大数据分析和业务结算。






  