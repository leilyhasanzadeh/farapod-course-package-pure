const manageSyllabusContent = {
  config: {},
  main: null,
  newRow: false,
  fetchContentList: function () {
    const syllabusId = this?.config?.syllabusId;
    const baseURL = this?.config?.baseURL;
    const token = this?.config?.token;

    fetch(baseURL + `api/course/syllabus/${syllabusId}`, {
      method: "GET",
      mode: "cors",
      headers: new Headers({
        _token_: token,
        _token_issuer_: "1",
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        const contentList = response?.data?.content;
        contentList.forEach((content, index) => {
          addContent({}, content);
        });
      });
  },
  createForm: function () {
    head = document.head || document.getElementsByTagName("head")[0];
    style = document.createElement("style");
    head.appendChild(style);
    style.type = "text/css";
    style.textContent = `
      .farapod-manage-content{
        direction: rtl;  
        font-family: tahoma;
        position: relative;
      }
      #farapod_content_list{
        padding-top: 2rem;
      }
      .farapod-content-record{
        padding-bottom: 1rem;
      }
      .farapod-manage-syllabus-content{
        display: flex;
      }
      .farapod-form-control {
        padding-left: 1rem;
      }
      .farapod-course-loader-container {
        position: absolute;
        top:0;
        left: 0;
        right: 0;
        margin: auto;
        width: 100%;
        height: 100%;
        background-color: #ddd;
        display: none;
        align-items: center;
        justify-content: center;
      }
      .farapod-course-loader {        
        border: 16px solid #f3f3f3;
        border-radius: 50%;
        border-top: 16px solid #3498db;
        width: 4rem;
        height: 4rem;
        -webkit-animation: spin 2s linear infinite; /* Safari */
        animation: spin 2s linear infinite;
      }
      
      /* Safari */
      @-webkit-keyframes spin {
        0% { -webkit-transform: rotate(0deg); }
        100% { -webkit-transform: rotate(360deg); }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;

    const element = document.querySelector(`#${this.config.id}`);
    element.innerHTML = `
      <div class="farapod-manage-content">
        <button id="farapod_add_syllabus_content">افزودن محتوا</button>
        <div id="farapod_content_list"></div>
        <div class="farapod-course-loader-container"><div class="farapod-course-loader"></div></div>
      </div>
    `;

    this.main = element;
    this.fetchContentList();

    element
      .querySelector(`#farapod_add_syllabus_content`)
      .addEventListener("click", addContent);
  },
};

const fileHandler = (event, callbackFunction) => {
  event.preventDefault();
  event.stopPropagation();

  const selectedFileElement = event.target.querySelector("input[type=file]");
  const selectedFile = selectedFileElement?.files[0];
  const baseURL = manageSyllabusContent?.config?.baseURL;
  const token = manageSyllabusContent?.config?.token;

  const fileData = new FormData();
  fileData.append("file", selectedFile);

  document.querySelector(".farapod-course-loader-container").style.display =
    "flex";

  fetch(baseURL + `api/course/file/upload`, {
    method: "POST",
    body: fileData,
    mode: "cors",
    headers: new Headers({
      _token_: token,
      _token_issuer_: "1",
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      callbackFunction(event, selectedFile?.name, response?.data?.hashCode);
      document.querySelector(".farapod-course-loader-container").style.display =
        "none";
    });
};

const submitHandler = (event, fileName, hashCode) => {
  const selectedTextElement = event.target.querySelector("input[type=text]");
  const selectedText = selectedTextElement.value;
  const syllabusId = manageSyllabusContent?.config?.syllabusId;
  const baseURL = manageSyllabusContent?.config?.baseURL;
  const token = manageSyllabusContent?.config?.token;

  const data = {
    syllabusId: syllabusId,
    contentList: [
      { name: selectedText, fileName: fileName, fileHash: hashCode },
    ],
  };

  document.querySelector(".farapod-course-loader-container").style.display =
    "flex";

  fetch(baseURL + `api/course/content/`, {
    method: "POST",
    mode: "cors",
    body: JSON.stringify(data),
    headers: new Headers({
      _token_: token,
      _token_issuer_: "1",
      "Content-Type": "application/json",
    }),
  })
    .then((response) => response.json())
    .then((response) => {
      removeContent();
      addContent({}, response?.data?.[0]);
      document.querySelector(".farapod-course-loader-container").style.display =
        "none";
    });
};

const addContent = (event, contentInfo) => {
  if (manageSyllabusContent.newRow) return;
  const contentList = document.querySelector("#farapod_content_list");
  const content = document.createElement("div");
  content.classList.add("farapod-content-record");
  content.innerHTML = `
    <${
      !contentInfo ? "form" : "div"
    } class="farapod-manage-syllabus-content">                   
      <div class="farapod-form-control farapod-content-name">
        <label>نام محتوا</label>
        <input type="text" value="${contentInfo ? contentInfo?.name : ""}"/>
      </div>
      <div class="farapod-form-control farapod-content-file">
        <label>فایل</label>
        ${
          !contentInfo
            ? `<input type="file" />`
            : `<input type="text" value="${contentInfo?.fileName}" disabled="true" />`
        }
      </div>
      ${
        !contentInfo
          ? `<button type="submit" value="submit" class="farapod-submit-content">ثبت</button>`
          : ""
      }
      <button type="button" class="farapod-remove-content" data-id =${
        contentInfo ? contentInfo?.id : ""
      }>حذف</button>
    </${!contentInfo ? "form" : "div"}>
  `;

  contentList.appendChild(content);

  content
    .querySelector(`.farapod-remove-content`)
    .addEventListener("click", removeContent);

  if (!contentInfo) {
    contentList.querySelector(`form`).addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopPropagation();
      fileHandler(event, submitHandler);
    });

    manageSyllabusContent.newRow = true;
  }
};

const removeContent = (event) => {
  const id = event?.target?.dataset?.id;
  const contentList = document.querySelector("#farapod_content_list");
  const baseURL = manageSyllabusContent?.config?.baseURL;
  const token = manageSyllabusContent?.config?.token;

  if (id) {
    const selectedChild = event.target.closest(".farapod-content-record");

    document.querySelector(".farapod-course-loader-container").style.display =
      "flex";

    fetch(baseURL + `api/course/content/${id}`, {
      method: "DELETE",
      mode: "cors",
      headers: new Headers({
        _token_: token,
        _token_issuer_: "1",
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        contentList.removeChild(selectedChild);
        document.querySelector(
          ".farapod-course-loader-container"
        ).style.display = "none";
      });
  } else {
    const childList = contentList.childNodes;
    contentList.removeChild(childList[childList.length - 1]);
    manageSyllabusContent.newRow = false;
  }
};

module.exports = manageSyllabusContent;
