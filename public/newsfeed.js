document.getElementById('postForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const post = await response.json();
            displayPost(post);
            this.reset();
        } else {
            const error = await response.text();
            console.error('Failed to post:', error);
            alert(`Error: ${error}`);
        }
    } catch (error) {
        console.error('Error during fetch:', error);
        alert('An error occurred while posting. Please try again.');
    }
});

// newsfeed.js
async function fetchPosts() {
    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }
        const data = await response.json();
        const { posts, currentUserId, userType } = data;
        posts.forEach(post => displayPost(post, currentUserId, userType)); // Pass userType
    } catch (error) {
        console.error('Error fetching posts:', error);
        alert('An error occurred while fetching posts. Please try again.');
    }
}


function displayPost(post, currentUserId, userType) {
    const newsfeed = document.getElementById('newsfeed');
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.setAttribute('data-id', post.id);

    // Determine user type (school or company)
    const postUserType = post.school_id ? 'school' : 'company';
    const userName = postUserType === 'school' ? post.school_name : post.company_name;
    const userEmail = postUserType === 'school' ? post.school_email : post.company_email;

    // Format post content
    const formattedContent = post.content.replace(/\n/g, '<br>')
        .replace(/\b((https?:\/\/)?(www\.[^\s]+))/g, (match, p1, p2) => {
            const url = p2 ? p1 : `https://${p1}`;
            return `<a href="${url}" target="_blank">${url}</a>`;
        });

    // Truncate long posts
    const maxLength = 200;
    let truncatedContent = formattedContent;
    let isLongPost = false;

    if (formattedContent.length > maxLength) {
        truncatedContent = formattedContent.substring(0, maxLength) + '...';
        isLongPost = true;
    }

    // Build the post HTML
    postDiv.innerHTML = `
        <p>
            <i class='bx bxs-${postUserType}'></i> 
            <strong style="color: ${postUserType === 'school' ? 'green' : 'blue'};">${userName}</strong><br><br> 
            ${truncatedContent}
            ${isLongPost ? `<button class="see-more" data-id="${post.id}">See More...</button>` : ''}
        </p>
        ${post.image_url ? `<img src="${post.image_url.startsWith('uploads/') ? '/' + post.image_url : post.image_url}" alt="Post Image">` : ''}
        <small>${new Date(post.created_at).toLocaleString()}</small>
        ${(userType === 'school' && post.school_id === currentUserId) || 
            (userType === 'company' && post.company_id === currentUserId) 
                ? `<button class="delete-button" data-id="${post.id}">Delete</button>` 
                : ''
            }
    `;

    // Prepend the post to the newsfeed
    newsfeed.prepend(postDiv);

    // Attach delete functionality if the delete button exists
    const deleteButton = postDiv.querySelector('.delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', deletePost);
    }

    // Styling for toggle buttons (See More/See Less)
    const style = document.createElement('style');
    style.innerHTML = `
        .see-more, .see-less {
            background: none;
            color: #007bff;
            border: none;
            cursor: pointer;
            font-size: 14px;
            padding: 0;
            outline: none;
        }
        .see-more:hover, .see-less:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);
}



// Delete post function
async function deletePost(event) {
    const postId = event.target.getAttribute('data-id');

    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const postDiv = event.target.closest('.post');
            postDiv.remove();
        } else {
            const error = await response.text();
            if (response.status === 403) {
                alert('You do not have permission to delete this post');
            } else if (response.status === 404) {
                alert('Post not found');
            } else {
                console.error('Failed to delete post:', error);
                alert(`Error: ${error}`);
            }
        }
    } catch (error) {
        console.error('Error during fetch:', error);
        alert('An error occurred while deleting the post. Please try again.');
    }
}



fetchPosts();

// Handle the file input change event
document.getElementById('fileInput').addEventListener('change', function (event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    const previewContainer = document.getElementById('imagePreview');
    const label = fileInput.nextElementSibling; // The label button

    if (file) {
        // Show image preview
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.innerHTML = ''; // Clear previous preview
            previewContainer.appendChild(img);
            previewContainer.innerHTML += `<p>Image selected</p>`;
            previewContainer.style.display = 'block'; // Show preview
        };
        reader.readAsDataURL(file);

        // Change button style to indicate upload
        label.classList.add('uploaded');
        label.textContent = '✔'; // Change "+" to checkmark or "Uploaded"
    } else {
        // Reset preview if no file is selected
        previewContainer.style.display = 'none';
        label.classList.remove('uploaded');
        label.textContent = '+'; // Revert button text back to "+"
    }
});



