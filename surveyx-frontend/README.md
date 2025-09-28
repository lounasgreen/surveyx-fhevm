# SurveyX - 机密问卷调查系统

基于FHEVM技术的隐私保护问卷调查平台，确保您的数据完全加密，只有授权用户才能查看结果。

## 功能特性

- 🔒 **完全隐私保护**: 基于FHEVM同态加密技术，所有答案数据完全加密存储
- 📝 **多种问题类型**: 支持单选、多选、文本、评分等多种问题类型
- 👥 **权限管理**: 精细化的权限控制，支持公开和私有问卷
- 📊 **数据分析**: 在保护隐私的同时提供详细的统计分析
- 🌐 **双语支持**: 支持中英双语界面
- 🎨 **现代化UI**: 响应式设计，支持深色模式

## 技术架构

- **前端**: Next.js + React + TypeScript + Tailwind CSS
- **加密技术**: FHEVM (Fully Homomorphic Encryption Virtual Machine)
- **智能合约**: Solidity + Hardhat
- **钱包集成**: MetaMask等Web3钱包

## 快速开始

### 前置要求

- Node.js >= 20
- npm >= 7.0.0
- MetaMask钱包

### 安装依赖

```bash
npm install
```

### 开发模式

#### 使用本地Mock模式 (推荐用于开发)

```bash
# 首先启动FHEVM Hardhat节点
cd ../fhevm-hardhat-template
npm install
npm run node

# 在新终端中启动前端
cd ../surveyx-frontend
npm run dev:mock
```

#### 使用真实Relayer SDK

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
surveyx-frontend/
├── app/                    # Next.js应用目录
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx          # 首页
│   └── providers.tsx     # 全局提供者
├── components/            # React组件
├── fhevm/                # FHEVM集成模块
│   ├── fhevmTypes.ts     # 类型定义
│   ├── useFhevm.tsx      # FHEVM Hook
│   └── internal/         # 内部实现
├── hooks/                # 自定义Hooks
├── lib/                  # 工具库
├── scripts/              # 构建脚本
└── types/                # TypeScript类型
```

## 使用说明

### 1. 创建问卷

1. 点击"创建问卷"按钮
2. 填写问卷标题和描述
3. 添加问题和选项
4. 设置权限和有效期
5. 激活问卷

### 2. 分享问卷

1. 复制问卷链接
2. 设置访问权限
3. 分享给目标用户

### 3. 填写问卷

1. 访问问卷链接
2. 连接MetaMask钱包
3. 填写问卷答案
4. 提交加密答案

### 4. 查看结果

1. 进入"我的问卷"
2. 选择要查看的问卷
3. 查看加密统计结果
4. 导出分析报告

## Mock模式说明

本项目支持两种运行模式：

### Mock模式 (`npm run dev:mock`)
- 使用`@fhevm/mock-utils`提供的本地mock实现
- 需要运行FHEVM Hardhat节点
- 适合开发和测试环境
- 完全模拟FHEVM功能，无需真实的relayer服务

### 生产模式 (`npm run dev`)
- 使用`@zama-fhe/relayer-sdk`连接真实的relayer服务
- 需要配置真实的网络环境
- 适合生产环境部署

## 智能合约

智能合约位于`../fhevm-hardhat-template/contracts/SurveyX.sol`，主要功能包括：

- 问卷创建和管理
- 加密答案存储
- 权限控制
- 统计分析
- 随机数生成

## 开发指南

### 添加新功能

1. 在`components/`目录下创建新组件
2. 在`hooks/`目录下创建自定义Hook
3. 更新智能合约（如需要）
4. 添加相应的测试

### 样式指南

- 使用Tailwind CSS进行样式开发
- 支持深色模式
- 遵循响应式设计原则
- 使用自定义CSS类进行复用

## 部署

### 智能合约部署

```bash
cd ../fhevm-hardhat-template
npm run compile
npm run deploy
```

### 前端部署

```bash
npm run build
# 部署到您的托管平台
```

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 许可证

BSD-3-Clause-Clear

## 联系我们

如有问题或建议，请通过GitHub Issues联系我们。
