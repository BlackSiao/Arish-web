---
title: docker
createTime: 2025/10/09 16:28:43
permalink: /notes/实操/mzeu9aqm/
---
# Docker 基础工作流
## 完整 Docker 工作流
一个完整的 Docker 工作流是这样的：

1. Docker 客户端联系了 Docker 守护进程（daemon）。
2. Docker 守护进程从 Docker Hub 拉取了 hello-world 镜像。（镜像架构：amd64）
3. Docker 守护进程基于该镜像创建了一个新的容器，容器中运行了一个可执行文件，这个文件生成了你现在看到的输出内容。
4. Docker 守护进程将输出流回给 Docker 客户端，客户端再把它显示在你的终端上。

## Image 文件

Docker 把应用程序及其依赖，打包在 image 文件里面。只有通过这个文件，才能生成 Docker 容器。Image 文件可以看作是容器的模板。Docker 根据 image 文件生成容器的实例。同一个 image 文件，可以生成多个同时运行的容器实例。

### 常用命令

- **列出本机的所有 image 文件**：
  ```bash
  docker image ls
  ```

- **删除 image 文件**：
  ```bash
  docker image rm [imageName]
  ```

## 运行 hello-world 镜像的流程

运行 `hello-world` 这个镜像文件的流程如下，用来熟悉一下 Docker 的工作原理：

1. **拉取 image 文件**：
   ```bash
   docker image pull library/hello-world
   ```
   - `docker image pull` 是抓取 image 文件的命令。
   - `library/hello-world` 是 image 文件在仓库里面的位置，其中 `library` 是 image 文件所在的组，`hello-world` 是 image 文件的名字。
   - 由于 Docker 官方提供的 image 文件，都放在 `library` 组里面，所以它是默认组，可以省略。因此，上面的命令可以写成：
     ```bash
     docker image pull hello-world
     ```
   - 抓取成功以后，就可以在本机看到这个 image 文件了：
     ```bash
     docker image ls
     ```

2. **运行 image 文件**：
   ```bash
   docker container run hello-world
   ```
   - 注意，`docker container run` 命令具有自动抓取 image 文件的功能。如果发现本地没有指定的 image 文件，就会从仓库自动抓取。因此，前面的 `docker image pull` 命令并不是必需的步骤。
在输出完提示后，`hello-world` 这个程序就执行完了，容器也就自动终止了，就像跑完就自动关闭的代码一样。因此，有些容器如果不主动关闭，它就会一直跑下去，对于这类容器，就必须要使用：
```bash
docker container kill [containerID]
```

## 容器文件

Image 文件生成的容器实例，其本身也是一个文件，并成为容器文件。一旦容器文件生成，则系统中除了之前保留的 image 之外，还有容器文件。并且关闭容器文件并不会删掉它，只是容器停止运行了而已。

### 常用命令

- **列出本机正在运行的容器**：
  ```bash
  docker container ls
  ```
- **列出本机所有容器，包括终止运行的容器**：
  ```bash
  docker container ls --all
  ```

对于终止运行的容器，此时容器只是停止运行了，如果之后不用了，不想继续占硬盘，可以用以下命令删掉：
```bash
docker container rm [containerID]
```

## 其他有用命令

1. **`docker container start [containerID]`**  
   如果使用 `docker container run` 则每运行一次，就会新建一个容器出来。同样的命令跑两次，就会出两个一模一样的容器文件。如果想重复利用容器，就要使用 `docker container start`。此命令用来运行那些目前暂时停止的容器文件。

2. **`docker container stop [containerID]`**  
   前面的 `docker container kill` 命令终止容器运行，相当于向容器里面的主进程发出 SIGKILL 信号。而 `docker container stop` 命令也是用来终止容器运行，相当于向容器里面的主进程发出 SIGTERM 信号，然后过一段时间再发出 SIGKILL 信号。  
   - SIGKILL：马上终止掉该进程。  
   - SIGTERM：给进程发终止信号，进程收拾自己的运行信息啥的，再自己干掉自己。

3. **`docker container logs [containerID]`**  
   `docker container logs` 命令用来查看 Docker 容器的输出，即容器里面 Shell 的标准输出。如果 `docker run` 命令运行容器的时候，没有使用 `-it` 参数，就要用这个命令查看输出。